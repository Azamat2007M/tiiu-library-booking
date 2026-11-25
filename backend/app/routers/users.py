from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import case, func, or_, and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import get_current_admin
from ..database import get_db
from ..models import Admin, Borrowing, BorrowingStatus, Staff, Student, StudyGroup
from ..schemas import (
    BorrowerOption,
    BorrowerType,
    PaginatedResponse,
    StaffCreate,
    StaffOut,
    StudentCreate,
    StudentOut,
)
from ..search_utils import build_trgm_filter, tokenize_query
from .students import create_student as students_create_student
from .students import list_students as students_list_students

router = APIRouter(prefix="/users", tags=["Students & Staff"])


@router.get("/students", response_model=PaginatedResponse[StudentOut])
async def list_students(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    q: str | None = Query(None),
    debtors_only: bool = Query(False),
    most_active: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    return await students_list_students(
        page=page,
        limit=limit,
        q=q,
        debtors_only=debtors_only,
        most_active=most_active,
        db=db,
        _=admin,
    )


@router.post("/students", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    return await students_create_student(payload=payload, db=db, _=admin)


@router.get("/staff", response_model=PaginatedResponse[StaffOut])
async def list_staff(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    q: str | None = Query(None),
    debtors_only: bool = Query(False),
    most_active: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    offset = (page - 1) * limit

    overdue_subquery = (
        select(Borrowing.borrower_id)
        .where(
            Borrowing.borrower_type == BorrowerType.STAFF,
            Borrowing.status == BorrowingStatus.OVERDUE,
        )
        .scalar_subquery()
    )

    base_query = select(Staff)
    count_query = select(func.count(Staff.id))

    if q:
        search_filter = or_(
            Staff.full_name.ilike(f"%{q.strip()}%"),
            Staff.department.ilike(f"%{q.strip()}%"),
        )
        base_query = base_query.where(search_filter)
        count_query = count_query.where(search_filter)

    if debtors_only:
        base_query = base_query.where(Staff.id.in_(overdue_subquery))
        count_query = count_query.where(Staff.id.in_(overdue_subquery))

    if most_active:
        base_query = base_query.order_by(Staff.borrow_count.desc(), Staff.id.desc())
    else:
        base_query = base_query.order_by(Staff.id.desc())

    total_count = (await db.execute(count_query)).scalar_one()

    stmt = base_query.offset(offset).limit(limit)
    result = await db.execute(stmt)
    staff_members = result.scalars().all()

    staff_ids = [s.id for s in staff_members]
    active_borrows_map = {}
    overdue_map = {}

    if staff_ids:
        b_stmt = (
            select(
                Borrowing.borrower_id,
                func.count(Borrowing.id).label("total_active"),
                func.max(case((Borrowing.status == BorrowingStatus.OVERDUE, 1), else_=0)).label("has_overdue"),
            )
            .where(
                Borrowing.borrower_type == BorrowerType.STAFF,
                Borrowing.borrower_id.in_(staff_ids),
                Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE]),
            )
            .group_by(Borrowing.borrower_id)
        )
        b_res = await db.execute(b_stmt)
        for row in b_res.all():
            active_borrows_map[row[0]] = row[1]
            overdue_map[row[0]] = bool(row[2])

    items = [
        StaffOut(
            id=s.id,
            full_name=s.full_name,
            department=s.department,
            phone=s.phone,
            borrow_count=s.borrow_count,
            has_overdue=overdue_map.get(s.id, False),
            active_borrows_count=active_borrows_map.get(s.id, 0),
            created_at=s.created_at,
        )
        for s in staff_members
    ]

    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.post("/staff", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: StaffCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    member = Staff(
        full_name=payload.full_name.strip(),
        department=payload.department.strip(),
        phone=payload.phone.strip(),
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return StaffOut.model_validate(member)


@router.get("/borrower-options", response_model=list[BorrowerOption])
async def search_borrower_options(
    borrower_type: BorrowerType = Query(...),
    q: str = Query("", min_length=0),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    query_str = q.strip()
    if borrower_type == BorrowerType.STUDENT:
        base_stmt = select(Student).options(selectinload(Student.group_rel))
        if query_str:
            trgm_filter = build_trgm_filter(Student.full_name, query_str)
            try:
                stmt = (
                    base_stmt
                    .where(trgm_filter)
                    .order_by(func.similarity(Student.full_name, query_str).desc())
                    .limit(15)
                )
                res = await db.execute(stmt)
                students = list(res.scalars().all())
            except Exception:
                words = tokenize_query(query_str)
                stmt = base_stmt.where(
                    and_(*[
                        or_(
                            Student.full_name.ilike(f"%{w}%"),
                            Student.phone.ilike(f"%{w}%"),
                            Student.group.ilike(f"%{w}%"),
                            Student.group_rel.has(StudyGroup.name.ilike(f"%{w}%")),
                        )
                        for w in words
                    ])
                ).limit(15)
                res = await db.execute(stmt)
                students = list(res.scalars().all())
        else:
            stmt = base_stmt.order_by(Student.full_name.asc()).limit(15)
            res = await db.execute(stmt)
            students = list(res.scalars().all())

        return [
            BorrowerOption(
                id=s.id,
                borrower_type=BorrowerType.STUDENT,
                full_name=s.full_name,
                identifier=(s.group_rel.name if s.group_rel else s.group) or "",
                phone=s.phone,
            )
            for s in students
        ]
    else:
        stmt = select(Staff)
        if query_str:
            words = tokenize_query(query_str)
            stmt = stmt.where(
                and_(*[
                    or_(
                        Staff.full_name.ilike(f"%{w}%"),
                        Staff.department.ilike(f"%{w}%"),
                    )
                    for w in words
                ])
            )
        stmt = stmt.order_by(Staff.full_name.asc()).limit(15)
        res = await db.execute(stmt)
        staff_members = res.scalars().all()
        return [
            BorrowerOption(
                id=s.id,
                borrower_type=BorrowerType.STAFF,
                full_name=s.full_name,
                identifier=s.department,
                phone=s.phone,
            )
            for s in staff_members
        ]
