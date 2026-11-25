import io
import re
from datetime import date, datetime, timezone
from typing import Any
import openpyxl
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import case, delete, distinct, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import get_current_admin
from ..database import get_db
from ..models import (
    Admin,
    BorrowerType,
    Borrowing,
    BorrowingStatus,
    Course,
    EducationForm,
    EducationType,
    Specialty,
    Student,
    StudyGroup,
)
from ..schemas import (
    LookupItem,
    LookupsResponse,
    PaginatedResponse,
    StudentCreate,
    StudentImportError,
    StudentImportSummary,
    StudentOut,
    StudentPhoneUpdate,
    StudentUpdate,
)
from ..search_utils import build_trgm_filter, python_difflib_rank, tokenize_query

router = APIRouter(prefix="/students", tags=["Students"])

def clean_phone(val: Any) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    if not s or s.lower() in ("none", "null", "nan", "-", "yo'q", "yoq"):
        return None
    cleaned = re.sub(r"[^\d+]", "", s)
    if not cleaned:
        return None
    if cleaned.startswith("+"):
        return cleaned
    if cleaned.startswith("998") and len(cleaned) == 12:
        return f"+{cleaned}"
    if len(cleaned) == 9:
        return f"+998{cleaned}"
    return f"+{cleaned}"

def parse_date(val: Any) -> date | None:
    if val is None:
        return None
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()
    s = str(val).strip()
    if not s or s.lower() in ("none", "null", "nan", "-"):
        return None

    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y", "%Y/%m/%d", "%Y.%m.%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass

    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        pass
    return None

async def get_or_create_lookup(
    model: Any,
    name: str | None,
    db: AsyncSession,
    cache: dict[str, int] | None = None,
) -> int | None:
    if not name or not str(name).strip():
        return None
    cleaned = str(name).strip()
    key = cleaned.lower()

    if cache is not None and key in cache:
        return cache[key]

    stmt = select(model).where(func.lower(model.name) == key)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        if cache is not None:
            cache[key] = existing.id
        return existing.id

    new_record = model(name=cleaned)
    db.add(new_record)
    await db.flush()
    if cache is not None:
        cache[key] = new_record.id
    return new_record.id

async def get_student_borrow_stats(student_id: int, db: AsyncSession):
    b_stmt = (
        select(
            func.count(Borrowing.id).label("total_active"),
            func.max(case((Borrowing.status == BorrowingStatus.OVERDUE, 1), else_=0)).label("has_overdue"),
        )
        .where(
            Borrowing.borrower_type == BorrowerType.STUDENT,
            Borrowing.borrower_id == student_id,
            Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE]),
        )
    )
    b_res = await db.execute(b_stmt)
    row = b_res.one_or_none()
    active_count = row[0] if row and row[0] else 0
    has_overdue = bool(row[1]) if row and row[1] else False
    return active_count, has_overdue

@router.get("/lookups", response_model=LookupsResponse)
async def get_all_lookups(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    edu_types = (await db.execute(select(EducationType).order_by(EducationType.name.asc()))).scalars().all()
    edu_forms = (await db.execute(select(EducationForm).order_by(EducationForm.name.asc()))).scalars().all()
    specialties = (await db.execute(select(Specialty).order_by(Specialty.name.asc()))).scalars().all()
    courses = (await db.execute(select(Course).order_by(Course.name.asc()))).scalars().all()
    groups = (await db.execute(select(StudyGroup).order_by(StudyGroup.name.asc()))).scalars().all()

    return LookupsResponse(
        education_types=[LookupItem.model_validate(x) for x in edu_types],
        education_forms=[LookupItem.model_validate(x) for x in edu_forms],
        specialties=[LookupItem.model_validate(x) for x in specialties],
        courses=[LookupItem.model_validate(x) for x in courses],
        groups=[LookupItem.model_validate(x) for x in groups],
    )

@router.get("/search", response_model=list[StudentOut])
async def search_students(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    query_str = q.strip()
    if not query_str:
        return []

    trgm_clause = build_trgm_filter(Student.full_name, query_str)
    base_stmt = (
        select(Student)
        .options(
            selectinload(Student.education_type),
            selectinload(Student.education_form),
            selectinload(Student.specialty),
            selectinload(Student.course),
            selectinload(Student.group_rel),
        )
    )

    students: list[Student] = []
    try:
        stmt = (
            base_stmt
            .where(trgm_clause)
            .order_by(func.similarity(Student.full_name, query_str).desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        students = list(res.scalars().all())
    except Exception:
        words = tokenize_query(query_str)
        ilike_clauses = [Student.full_name.ilike(f"%{w}%") for w in words]
        stmt = base_stmt.where(and_(*ilike_clauses)).limit(50)
        res = await db.execute(stmt)
        candidates = list(res.scalars().all())
        if not candidates:
            broad_stmt = base_stmt.order_by(Student.id.desc()).limit(200)
            candidates = list((await db.execute(broad_stmt)).scalars().all())
        students = python_difflib_rank(query_str, candidates, lambda s: s.full_name, limit=limit)

    student_ids = [s.id for s in students]
    active_borrows_map = {}
    overdue_map = {}
    if student_ids:
        b_stmt = (
            select(
                Borrowing.borrower_id,
                func.count(Borrowing.id).label("total_active"),
                func.max(case((Borrowing.status == BorrowingStatus.OVERDUE, 1), else_=0)).label("has_overdue"),
            )
            .where(
                Borrowing.borrower_type == BorrowerType.STUDENT,
                Borrowing.borrower_id.in_(student_ids),
                Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE]),
            )
            .group_by(Borrowing.borrower_id)
        )
        b_res = await db.execute(b_stmt)
        for row in b_res.all():
            active_borrows_map[row[0]] = row[1]
            overdue_map[row[0]] = bool(row[2])

    return [
        StudentOut(
            id=s.id,
            full_name=s.full_name,
            birth_date=s.birth_date,
            phone=s.phone,
            education_type_id=s.education_type_id,
            education_type_name=s.education_type.name if s.education_type else None,
            education_form_id=s.education_form_id,
            education_form_name=s.education_form.name if s.education_form else None,
            specialty_id=s.specialty_id,
            specialty_name=s.specialty.name if s.specialty else s.major,
            course_id=s.course_id,
            course_name=s.course.name if s.course else None,
            group_id=s.group_id,
            group_name=s.group_rel.name if s.group_rel else s.group,
            major=s.specialty.name if s.specialty else s.major,
            group=s.group_rel.name if s.group_rel else s.group,
            borrow_count=s.borrow_count,
            has_overdue=overdue_map.get(s.id, False),
            active_borrows_count=active_borrows_map.get(s.id, 0),
            created_at=s.created_at,
        )
        for s in students
    ]

@router.get("", response_model=PaginatedResponse[StudentOut])
async def list_students(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    q: str | None = Query(None),
    debtors_only: bool = Query(False),
    most_active: bool = Query(False),
    group_id: int | None = Query(None),
    course_id: int | None = Query(None),
    specialty_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    offset = (page - 1) * limit

    overdue_subquery = (
        select(Borrowing.borrower_id)
        .where(
            Borrowing.borrower_type == BorrowerType.STUDENT,
            Borrowing.status == BorrowingStatus.OVERDUE,
        )
        .scalar_subquery()
    )

    base_query = (
        select(Student)
        .options(
            selectinload(Student.education_type),
            selectinload(Student.education_form),
            selectinload(Student.specialty),
            selectinload(Student.course),
            selectinload(Student.group_rel),
        )
    )
    count_query = select(func.count(Student.id))

    if q and q.strip():
        term = f"%{q.strip()}%"
        search_filter = or_(
            Student.full_name.ilike(term),
            Student.phone.ilike(term),
            Student.major.ilike(term),
            Student.group.ilike(term),
            Student.group_rel.has(StudyGroup.name.ilike(term)),
            Student.specialty.has(Specialty.name.ilike(term)),
        )
        base_query = base_query.where(search_filter)
        count_query = count_query.where(search_filter)

    if group_id:
        base_query = base_query.where(Student.group_id == group_id)
        count_query = count_query.where(Student.group_id == group_id)

    if course_id:
        base_query = base_query.where(Student.course_id == course_id)
        count_query = count_query.where(Student.course_id == course_id)

    if specialty_id:
        base_query = base_query.where(Student.specialty_id == specialty_id)
        count_query = count_query.where(Student.specialty_id == specialty_id)

    if debtors_only:
        base_query = base_query.where(Student.id.in_(overdue_subquery))
        count_query = count_query.where(Student.id.in_(overdue_subquery))

    if most_active:
        base_query = base_query.order_by(Student.borrow_count.desc(), Student.id.desc())
    else:
        base_query = base_query.order_by(Student.id.desc())

    total_count = (await db.execute(count_query)).scalar_one()

    stmt = base_query.offset(offset).limit(limit)
    result = await db.execute(stmt)
    students = result.scalars().all()

    student_ids = [s.id for s in students]
    active_borrows_map = {}
    overdue_map = {}

    if student_ids:
        b_stmt = (
            select(
                Borrowing.borrower_id,
                func.count(Borrowing.id).label("total_active"),
                func.max(case((Borrowing.status == BorrowingStatus.OVERDUE, 1), else_=0)).label("has_overdue"),
            )
            .where(
                Borrowing.borrower_type == BorrowerType.STUDENT,
                Borrowing.borrower_id.in_(student_ids),
                Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE]),
            )
            .group_by(Borrowing.borrower_id)
        )
        b_res = await db.execute(b_stmt)
        for row in b_res.all():
            active_borrows_map[row[0]] = row[1]
            overdue_map[row[0]] = bool(row[2])

    items = [
        StudentOut(
            id=s.id,
            full_name=s.full_name,
            birth_date=s.birth_date,
            phone=s.phone,
            education_type_id=s.education_type_id,
            education_type_name=s.education_type.name if s.education_type else None,
            education_form_id=s.education_form_id,
            education_form_name=s.education_form.name if s.education_form else None,
            specialty_id=s.specialty_id,
            specialty_name=s.specialty.name if s.specialty else s.major,
            course_id=s.course_id,
            course_name=s.course.name if s.course else None,
            group_id=s.group_id,
            group_name=s.group_rel.name if s.group_rel else s.group,
            major=s.specialty.name if s.specialty else s.major,
            group=s.group_rel.name if s.group_rel else s.group,
            borrow_count=s.borrow_count,
            has_overdue=overdue_map.get(s.id, False),
            active_borrows_count=active_borrows_map.get(s.id, 0),
            created_at=s.created_at,
        )
        for s in students
    ]

    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )

@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    edu_type_id = payload.education_type_id or await get_or_create_lookup(
        EducationType, payload.education_type, db
    )
    edu_form_id = payload.education_form_id or await get_or_create_lookup(
        EducationForm, payload.education_form, db
    )
    spec_id = payload.specialty_id or await get_or_create_lookup(
        Specialty, payload.specialty or payload.major, db
    )
    course_id = payload.course_id or await get_or_create_lookup(
        Course, payload.course, db
    )
    group_id = payload.group_id or await get_or_create_lookup(
        StudyGroup, payload.group, db
    )

    phone_cleaned = clean_phone(payload.phone)

    group_name = None
    if group_id:
        g = await db.get(StudyGroup, group_id)
        group_name = g.name if g else None
    elif payload.group:
        group_name = payload.group.strip()

    major_name = None
    if spec_id:
        sp = await db.get(Specialty, spec_id)
        major_name = sp.name if sp else None
    elif payload.specialty or payload.major:
        major_name = (payload.specialty or payload.major).strip()

    student = Student(
        full_name=payload.full_name.strip(),
        birth_date=payload.birth_date,
        phone=phone_cleaned,
        education_type_id=edu_type_id,
        education_form_id=edu_form_id,
        specialty_id=spec_id,
        course_id=course_id,
        group_id=group_id,
        major=major_name,
        group=group_name,
    )
    db.add(student)
    await db.commit()

    stmt = (
        select(Student)
        .options(
            selectinload(Student.education_type),
            selectinload(Student.education_form),
            selectinload(Student.specialty),
            selectinload(Student.course),
            selectinload(Student.group_rel),
        )
        .where(Student.id == student.id)
    )
    fresh_student = (await db.execute(stmt)).scalar_one()

    return StudentOut(
        id=fresh_student.id,
        full_name=fresh_student.full_name,
        birth_date=fresh_student.birth_date,
        phone=fresh_student.phone,
        education_type_id=fresh_student.education_type_id,
        education_type_name=fresh_student.education_type.name if fresh_student.education_type else None,
        education_form_id=fresh_student.education_form_id,
        education_form_name=fresh_student.education_form.name if fresh_student.education_form else None,
        specialty_id=fresh_student.specialty_id,
        specialty_name=fresh_student.specialty.name if fresh_student.specialty else fresh_student.major,
        course_id=fresh_student.course_id,
        course_name=fresh_student.course.name if fresh_student.course else None,
        group_id=fresh_student.group_id,
        group_name=fresh_student.group_rel.name if fresh_student.group_rel else fresh_student.group,
        major=fresh_student.specialty.name if fresh_student.specialty else fresh_student.major,
        group=fresh_student.group_rel.name if fresh_student.group_rel else fresh_student.group,
        borrow_count=fresh_student.borrow_count,
        has_overdue=False,
        active_borrows_count=0,
        created_at=fresh_student.created_at,
    )

@router.put("/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = (
        select(Student)
        .where(Student.id == student_id)
        .with_for_update()
    )
    student = (await db.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    edu_type_id = payload.education_type_id or await get_or_create_lookup(
        EducationType, payload.education_type, db
    )
    edu_form_id = payload.education_form_id or await get_or_create_lookup(
        EducationForm, payload.education_form, db
    )
    spec_id = payload.specialty_id or await get_or_create_lookup(
        Specialty, payload.specialty or payload.major, db
    )
    course_id = payload.course_id or await get_or_create_lookup(
        Course, payload.course, db
    )
    group_id = payload.group_id or await get_or_create_lookup(
        StudyGroup, payload.group, db
    )

    phone_cleaned = clean_phone(payload.phone)

    group_name = None
    if group_id:
        g = await db.get(StudyGroup, group_id)
        group_name = g.name if g else None
    elif payload.group:
        group_name = payload.group.strip()

    major_name = None
    if spec_id:
        sp = await db.get(Specialty, spec_id)
        major_name = sp.name if sp else None
    elif payload.specialty or payload.major:
        major_name = (payload.specialty or payload.major).strip()

    student.full_name = payload.full_name.strip()
    student.birth_date = payload.birth_date
    student.phone = phone_cleaned
    student.education_type_id = edu_type_id
    student.education_form_id = edu_form_id
    student.specialty_id = spec_id
    student.course_id = course_id
    student.group_id = group_id
    if group_name:
        student.group = group_name
    if major_name:
        student.major = major_name

    await db.commit()

    rel_stmt = (
        select(Student)
        .options(
            selectinload(Student.education_type),
            selectinload(Student.education_form),
            selectinload(Student.specialty),
            selectinload(Student.course),
            selectinload(Student.group_rel),
        )
        .where(Student.id == student_id)
    )
    fresh_student = (await db.execute(rel_stmt)).scalar_one()
    active_cnt, overdue_bool = await get_student_borrow_stats(student_id, db)

    return StudentOut(
        id=fresh_student.id,
        full_name=fresh_student.full_name,
        birth_date=fresh_student.birth_date,
        phone=fresh_student.phone,
        education_type_id=fresh_student.education_type_id,
        education_type_name=fresh_student.education_type.name if fresh_student.education_type else None,
        education_form_id=fresh_student.education_form_id,
        education_form_name=fresh_student.education_form.name if fresh_student.education_form else None,
        specialty_id=fresh_student.specialty_id,
        specialty_name=fresh_student.specialty.name if fresh_student.specialty else fresh_student.major,
        course_id=fresh_student.course_id,
        course_name=fresh_student.course.name if fresh_student.course else None,
        group_id=fresh_student.group_id,
        group_name=fresh_student.group_rel.name if fresh_student.group_rel else fresh_student.group,
        major=fresh_student.specialty.name if fresh_student.specialty else fresh_student.major,
        group=fresh_student.group_rel.name if fresh_student.group_rel else fresh_student.group,
        borrow_count=fresh_student.borrow_count,
        has_overdue=overdue_bool,
        active_borrows_count=active_cnt,
        created_at=fresh_student.created_at,
    )

@router.delete("/{student_id}")
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = select(Student).where(Student.id == student_id).with_for_update()
    student = (await db.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    loan_check = select(func.count(Borrowing.id)).where(
        Borrowing.borrower_type == BorrowerType.STUDENT,
        Borrowing.borrower_id == student_id,
        Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE]),
    )
    unreturned = (await db.execute(loan_check)).scalar_one()
    if unreturned > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete student with unreturned books",
        )

    await db.execute(
        delete(Borrowing).where(
            Borrowing.borrower_type == BorrowerType.STUDENT,
            Borrowing.borrower_id == student_id,
        )
    )
    await db.delete(student)
    await db.commit()
    return {"message": "Student deleted successfully", "id": student_id}

@router.patch("/{student_id}/phone", response_model=StudentOut)
async def update_student_phone(
    student_id: int,
    payload: StudentPhoneUpdate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = (
        select(Student)
        .options(
            selectinload(Student.education_type),
            selectinload(Student.education_form),
            selectinload(Student.specialty),
            selectinload(Student.course),
            selectinload(Student.group_rel),
        )
        .where(Student.id == student_id)
    )
    student = (await db.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    cleaned = clean_phone(payload.phone)
    if not cleaned:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    student.phone = cleaned
    await db.commit()

    active_cnt, overdue_bool = await get_student_borrow_stats(student_id, db)

    return StudentOut(
        id=student.id,
        full_name=student.full_name,
        birth_date=student.birth_date,
        phone=student.phone,
        education_type_id=student.education_type_id,
        education_type_name=student.education_type.name if student.education_type else None,
        education_form_id=student.education_form_id,
        education_form_name=student.education_form.name if student.education_form else None,
        specialty_id=student.specialty_id,
        specialty_name=student.specialty.name if student.specialty else student.major,
        course_id=student.course_id,
        course_name=student.course.name if student.course else None,
        group_id=student.group_id,
        group_name=student.group_rel.name if student.group_rel else student.group,
        major=student.specialty.name if student.specialty else student.major,
        group=student.group_rel.name if student.group_rel else student.group,
        borrow_count=student.borrow_count,
        has_overdue=overdue_bool,
        active_borrows_count=active_cnt,
        created_at=student.created_at,
    )

@router.post("/import-excel", response_model=StudentImportSummary)
async def import_students_excel(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="Faqat .xlsx formatidagi Excel fayllar qabul qilinadi.",
        )

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fayl hajmi 5 MB dan oshmasligi kerak.")

    if not contents.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=400, detail="Faqat haqiqiy .xlsx Excel fayllar qabul qilinadi.")

    try:
        wb = openpyxl.load_workbook(io.BytesIO(contents), read_only=True, data_only=True)
        sheet = wb.active
        if not sheet:
            raise HTTPException(status_code=400, detail="Excel faylda varaq topilmadi.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel faylni o'qishda xatolik: {str(e)}")

    edu_types_res = await db.execute(select(EducationType))
    edu_forms_res = await db.execute(select(EducationForm))
    spec_res = await db.execute(select(Specialty))
    course_res = await db.execute(select(Course))
    group_res = await db.execute(select(StudyGroup))

    cache_edu_types: dict[str, int] = {x.name.lower().strip(): x.id for x in edu_types_res.scalars().all()}
    cache_edu_forms: dict[str, int] = {x.name.lower().strip(): x.id for x in edu_forms_res.scalars().all()}
    cache_spec: dict[str, int] = {x.name.lower().strip(): x.id for x in spec_res.scalars().all()}
    cache_courses: dict[str, int] = {x.name.lower().strip(): x.id for x in course_res.scalars().all()}
    cache_groups: dict[str, int] = {x.name.lower().strip(): x.id for x in group_res.scalars().all()}

    all_raw_rows = list(sheet.iter_rows(values_only=True))
    if not all_raw_rows:
        return StudentImportSummary(processed=0, added=0, updated=0, failed=0, errors=[])

    if len(all_raw_rows) - 1 > 5000:
        raise HTTPException(status_code=400, detail="Maksimal 5000 qator ruxsat etilgan.")

    col_map: dict[str, int] = {}
    header_row_idx = 0

    for r_idx, row in enumerate(all_raw_rows[:5]):
        if not row:
            continue
        row_str = [str(c).strip().lower() if c is not None else "" for c in row]
        if any("name" in c or "ism" in c or "f.i.sh" in c or "talaba" in c for c in row_str):
            header_row_idx = r_idx
            for c_idx, val in enumerate(row_str):
                if any(k in val for k in ["full name", "f.i.sh", "ism", "student name"]):
                    col_map["full_name"] = c_idx
                elif any(k in val for k in ["birth date", "tug‘ilgan", "tug'ilgan", "tugilgan", "birthday"]):
                    col_map["birth_date"] = c_idx
                elif any(k in val for k in ["phone", "telefon", "tel"]):
                    col_map["phone"] = c_idx
                elif any(k in val for k in ["education type", "ta'lim turi", "ta‘lim turi", "talim turi"]):
                    col_map["education_type"] = c_idx
                elif any(k in val for k in ["education form", "ta'lim shakli", "ta‘lim shakli", "talim shakli"]):
                    col_map["education_form"] = c_idx
                elif any(k in val for k in ["specialty", "speciality", "mutaxassislik", "yo'nalish", "yonalish"]):
                    col_map["specialty"] = c_idx
                elif any(k in val for k in ["course", "kurs", "talaba kursi"]):
                    col_map["course"] = c_idx
                elif any(k in val for k in ["group", "guruh"]):
                    col_map["group"] = c_idx
            break

    if "full_name" not in col_map:
        col_map = {
            "full_name": 0,
            "birth_date": 1,
            "phone": 2,
            "education_type": 3,
            "education_form": 4,
            "specialty": 5,
            "course": 6,
            "group": 7,
        }

    data_rows = all_raw_rows[header_row_idx + 1:]

    def extract_unique_lookup_names(field: str) -> dict[str, str]:
        idx = col_map.get(field)
        res: dict[str, str] = {}
        if idx is None:
            return res
        for r in data_rows:
            if r and idx < len(r) and r[idx] is not None:
                val = str(r[idx]).strip()
                if val and val.lower() not in ("none", "null", "nan", "-"):
                    res[val.lower()] = val
        return res

    async def batch_ensure_lookups(model: Any, items_dict: dict[str, str], cache: dict[str, int]):
        to_create = []
        for low_key, display_name in items_dict.items():
            if low_key not in cache:
                to_create.append(model(name=display_name))
        if to_create:
            db.add_all(to_create)
            await db.flush()
            for obj in to_create:
                cache[obj.name.lower().strip()] = obj.id

    await batch_ensure_lookups(EducationType, extract_unique_lookup_names("education_type"), cache_edu_types)
    await batch_ensure_lookups(EducationForm, extract_unique_lookup_names("education_form"), cache_edu_forms)
    await batch_ensure_lookups(Specialty, extract_unique_lookup_names("specialty"), cache_spec)
    await batch_ensure_lookups(Course, extract_unique_lookup_names("course"), cache_courses)
    await batch_ensure_lookups(StudyGroup, extract_unique_lookup_names("group"), cache_groups)

    existing_students_res = await db.execute(select(Student))
    student_lookup_map: dict[tuple[str, date | None], Student] = {}
    for st in existing_students_res.scalars().all():
        key = (st.full_name.strip().lower(), st.birth_date)
        student_lookup_map[key] = st

    processed = 0
    added = 0
    updated = 0
    failed = 0
    errors: list[StudentImportError] = []

    for offset_idx, row in enumerate(data_rows, start=header_row_idx + 2):
        if not row or all(v is None or str(v).strip() == "" for v in row):
            continue

        processed += 1

        def get_val(field_name: str) -> Any:
            idx = col_map.get(field_name)
            if idx is not None and idx < len(row):
                return row[idx]
            return None

        raw_name = get_val("full_name")
        if not raw_name or not str(raw_name).strip():
            failed += 1
            errors.append(StudentImportError(row_number=offset_idx, reason="Talaba ismi bo'sh."))
            continue

        full_name = str(raw_name).strip()
        birth_date = parse_date(get_val("birth_date"))
        phone = clean_phone(get_val("phone"))

        raw_edu_type = get_val("education_type")
        raw_edu_form = get_val("education_form")
        raw_spec = get_val("specialty")
        raw_course = get_val("course")
        raw_group = get_val("group")

        edu_type_id = cache_edu_types.get(str(raw_edu_type).strip().lower()) if raw_edu_type else None
        edu_form_id = cache_edu_forms.get(str(raw_edu_form).strip().lower()) if raw_edu_form else None
        spec_id = cache_spec.get(str(raw_spec).strip().lower()) if raw_spec else None
        course_id = cache_courses.get(str(raw_course).strip().lower()) if raw_course else None
        group_id = cache_groups.get(str(raw_group).strip().lower()) if raw_group else None

        spec_str = str(raw_spec).strip() if raw_spec else None
        group_str = str(raw_group).strip() if raw_group else None

        match_key = (full_name.lower(), birth_date)
        if match_key in student_lookup_map:
            existing_st = student_lookup_map[match_key]
            if phone:
                existing_st.phone = phone
            if edu_type_id:
                existing_st.education_type_id = edu_type_id
            if edu_form_id:
                existing_st.education_form_id = edu_form_id
            if spec_id:
                existing_st.specialty_id = spec_id
                existing_st.major = spec_str
            if course_id:
                existing_st.course_id = course_id
            if group_id:
                existing_st.group_id = group_id
                existing_st.group = group_str
            updated += 1
        else:
            new_st = Student(
                full_name=full_name,
                birth_date=birth_date,
                phone=phone,
                education_type_id=edu_type_id,
                education_form_id=edu_form_id,
                specialty_id=spec_id,
                course_id=course_id,
                group_id=group_id,
                major=spec_str,
                group=group_str,
            )
            db.add(new_st)
            student_lookup_map[match_key] = new_st
            added += 1

    await db.commit()

    return StudentImportSummary(
        processed=processed,
        added=added,
        updated=updated,
        failed=failed,
        errors=errors[:100],
    )
