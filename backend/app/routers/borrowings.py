from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import get_current_admin
from ..database import get_db
from ..models import Admin, Book, BorrowerType, Borrowing, BorrowingStatus, Category, Staff, Student
from ..schemas import (
    BorrowingBatchCreate,
    BorrowingCountsSummary,
    BorrowingCreate,
    BorrowingOut,
    PaginatedResponse,
)
from .students import clean_phone

router = APIRouter(prefix="/borrowings", tags=["Borrowings"])


def resolve_effective_status(status_val: BorrowingStatus, due_date: datetime) -> BorrowingStatus:
    if status_val == BorrowingStatus.ACTIVE:
        now = datetime.now(timezone.utc)
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)
        if due_date < now:
            return BorrowingStatus.OVERDUE
    return status_val


async def sync_overdue_borrowings(db: AsyncSession):
    now = datetime.now(timezone.utc)
    stmt = (
        update(Borrowing)
        .where(
            Borrowing.status == BorrowingStatus.ACTIVE,
            Borrowing.due_date < now,
        )
        .values(status=BorrowingStatus.OVERDUE)
    )
    await db.execute(stmt)
    await db.commit()


update_overdue_statuses = sync_overdue_borrowings


@router.post("", response_model=BorrowingOut, status_code=status.HTTP_201_CREATED)
async def create_borrowing(
    payload: BorrowingCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    book_stmt = select(Book).where(Book.id == payload.book_id).with_for_update()
    book_res = await db.execute(book_stmt)
    book = book_res.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_qty <= 0:
        raise HTTPException(
            status_code=400,
            detail="Book is currently out of stock (available quantity is 0)",
        )

    borrower_name = ""
    borrower_phone = ""
    if payload.borrower_type == BorrowerType.STUDENT:
        s_stmt = select(Student).where(Student.id == payload.borrower_id).with_for_update()
        s_res = await db.execute(s_stmt)
        student = s_res.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        student.borrow_count += 1
        borrower_name = student.full_name
        borrower_phone = student.phone or ""
    else:
        st_stmt = select(Staff).where(Staff.id == payload.borrower_id).with_for_update()
        st_res = await db.execute(st_stmt)
        staff = st_res.scalar_one_or_none()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff member not found")
        staff.borrow_count += 1
        borrower_name = staff.full_name
        borrower_phone = staff.phone

    book.available_qty -= 1

    issue_date = datetime.now(timezone.utc)
    due_date = issue_date + timedelta(days=14)

    borrowing = Borrowing(
        book_id=book.id,
        borrower_type=payload.borrower_type,
        borrower_id=payload.borrower_id,
        issue_date=issue_date,
        due_date=due_date,
        status=BorrowingStatus.ACTIVE,
    )
    db.add(borrowing)
    await db.commit()
    await db.refresh(borrowing)

    cat_res = await db.execute(select(Category.name).where(Category.id == book.category_id))
    cat_name = cat_res.scalar_one_or_none()

    return BorrowingOut(
        id=borrowing.id,
        book_id=borrowing.book_id,
        book_title=book.title,
        category_name=cat_name,
        borrower_type=borrowing.borrower_type,
        borrower_id=borrowing.borrower_id,
        borrower_name=borrower_name,
        borrower_phone=borrower_phone,
        issue_date=borrowing.issue_date,
        due_date=borrowing.due_date,
        return_date=borrowing.return_date,
        returned_at=borrowing.returned_at,
        status=resolve_effective_status(borrowing.status, borrowing.due_date),
    )


@router.post("/batch", response_model=list[BorrowingOut], status_code=status.HTTP_201_CREATED)
async def create_borrowings_batch(
    payload: BorrowingBatchCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    if not (1 <= len(payload.book_ids) <= 5):
        raise HTTPException(
            status_code=400,
            detail="Kitoblar soni 1 tadan 5 tagacha bo'lishi kerak",
        )
    if len(payload.book_ids) != len(set(payload.book_ids)):
        raise HTTPException(
            status_code=400,
            detail="Bir xil kitobni bir vaqtda bir nechta marta tanlab bo'lmaydi",
        )

    s_stmt = select(Student).where(Student.id == payload.student_id).with_for_update()
    s_res = await db.execute(s_stmt)
    student = s_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if payload.phone and payload.phone.strip():
        cleaned = clean_phone(payload.phone)
        if cleaned and not student.phone:
            student.phone = cleaned

    student.borrow_count += len(payload.book_ids)

    b_stmt = select(Book).where(Book.id.in_(payload.book_ids)).with_for_update()
    b_res = await db.execute(b_stmt)
    books_map = {b.id: b for b in b_res.scalars().all()}

    for b_id in payload.book_ids:
        if b_id not in books_map:
            raise HTTPException(status_code=404, detail=f"Kitob ID #{b_id} topilmadi")
        book = books_map[b_id]
        if book.available_qty < 1:
            raise HTTPException(
                status_code=400,
                detail=f"'{book.title}' kitobi qolmagan (mavjud nusxalar: 0)",
            )

    cat_ids = list({b.category_id for b in books_map.values() if b.category_id})
    cat_names = {}
    if cat_ids:
        c_res = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
        cat_names = {c.id: c.name for c in c_res.scalars().all()}

    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=14)
    created_borrowings: list[Borrowing] = []

    for b_id in payload.book_ids:
        book = books_map[b_id]
        book.available_qty -= 1
        borrowing = Borrowing(
            book_id=book.id,
            borrower_type=BorrowerType.STUDENT,
            borrower_id=student.id,
            issue_date=now,
            due_date=due_date,
            status=BorrowingStatus.ACTIVE,
        )
        db.add(borrowing)
        created_borrowings.append(borrowing)

    await db.commit()

    for b in created_borrowings:
        await db.refresh(b)

    return [
        BorrowingOut(
            id=b.id,
            book_id=b.book_id,
            book_title=books_map[b.book_id].title,
            category_name=cat_names.get(books_map[b.book_id].category_id),
            borrower_type=b.borrower_type,
            borrower_id=b.borrower_id,
            borrower_name=student.full_name,
            borrower_phone=student.phone,
            issue_date=b.issue_date,
            due_date=b.due_date,
            return_date=b.return_date,
            returned_at=b.returned_at,
            status=resolve_effective_status(b.status, b.due_date),
        )
        for b in created_borrowings
    ]


@router.post("/{borrowing_id}/return", response_model=BorrowingOut)
async def return_borrowing(
    borrowing_id: int,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = (
        select(Borrowing)
        .options(selectinload(Borrowing.book))
        .where(Borrowing.id == borrowing_id)
        .with_for_update()
    )
    res = await db.execute(stmt)
    borrowing = res.scalar_one_or_none()

    if not borrowing:
        raise HTTPException(status_code=404, detail="Borrowing record not found")

    if borrowing.status == BorrowingStatus.RETURNED:
        raise HTTPException(status_code=400, detail="This book has already been marked as returned")

    now = datetime.now(timezone.utc)
    borrowing.status = BorrowingStatus.RETURNED
    borrowing.return_date = now
    borrowing.returned_at = now

    book = borrowing.book
    book.available_qty = min(book.total_qty, book.available_qty + 1)

    await db.commit()
    await db.refresh(borrowing)

    borrower_name = ""
    borrower_phone = ""
    if borrowing.borrower_type == BorrowerType.STUDENT:
        u_res = await db.execute(select(Student).where(Student.id == borrowing.borrower_id))
        user = u_res.scalar_one_or_none()
    else:
        u_res = await db.execute(select(Staff).where(Staff.id == borrowing.borrower_id))
        user = u_res.scalar_one_or_none()

    if user:
        borrower_name = user.full_name
        borrower_phone = user.phone

    return BorrowingOut(
        id=borrowing.id,
        book_id=borrowing.book_id,
        book_title=book.title,
        category_name=None,
        borrower_type=borrowing.borrower_type,
        borrower_id=borrowing.borrower_id,
        borrower_name=borrower_name,
        borrower_phone=borrower_phone,
        issue_date=borrowing.issue_date,
        due_date=borrowing.due_date,
        return_date=borrowing.return_date,
        returned_at=borrowing.returned_at,
        status=borrowing.status,
    )


@router.get("/counts", response_model=BorrowingCountsSummary)
async def get_borrowings_counts(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    await sync_overdue_borrowings(db)
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    active_stmt = select(func.count(Borrowing.id)).where(
        Borrowing.status == BorrowingStatus.ACTIVE,
        Borrowing.due_date >= now,
    )
    active_count = (await db.execute(active_stmt)).scalar_one()

    overdue_stmt = select(func.count(Borrowing.id)).where(
        or_(
            Borrowing.status == BorrowingStatus.OVERDUE,
            and_(Borrowing.status == BorrowingStatus.ACTIVE, Borrowing.due_date < now),
        )
    )
    overdue_count = (await db.execute(overdue_stmt)).scalar_one()

    ret_7d_stmt = select(func.count(Borrowing.id)).where(
        Borrowing.status == BorrowingStatus.RETURNED,
        func.coalesce(Borrowing.returned_at, Borrowing.return_date) >= seven_days_ago,
    )
    ret_7d_count = (await db.execute(ret_7d_stmt)).scalar_one()

    full_stmt = select(func.count(Borrowing.id))
    full_count = (await db.execute(full_stmt)).scalar_one()

    all_operational = active_count + overdue_count + ret_7d_count

    return BorrowingCountsSummary(
        all=all_operational,
        active=active_count,
        overdue=overdue_count,
        returned_7d=ret_7d_count,
        full_history=full_count,
    )


@router.get("", response_model=PaginatedResponse[BorrowingOut])
async def list_borrowings(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status_filter: str | None = Query(None),
    borrower_type: BorrowerType | None = Query(None),
    borrower_id: int | None = Query(None),
    q: str | None = Query(None),
    overdue_only: bool = Query(False),
    full_history: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    await sync_overdue_borrowings(db)

    s_filter = status_filter if isinstance(status_filter, str) else None
    q_str = q.strip() if (isinstance(q, str) and q.strip()) else None
    b_type = borrower_type if isinstance(borrower_type, BorrowerType) else None
    b_id = borrower_id if isinstance(borrower_id, int) else None
    is_overdue_only = overdue_only if isinstance(overdue_only, bool) else False
    is_full_history = full_history if isinstance(full_history, bool) else False

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    offset = (page - 1) * limit

    base_query = select(Borrowing).options(selectinload(Borrowing.book))
    count_query = select(func.count(Borrowing.id))

    if is_overdue_only or s_filter == "overdue":
        cond = or_(
            Borrowing.status == BorrowingStatus.OVERDUE,
            and_(Borrowing.status == BorrowingStatus.ACTIVE, Borrowing.due_date < now),
        )
        base_query = base_query.where(cond)
        count_query = count_query.where(cond)
    elif s_filter == "active":
        cond = and_(Borrowing.status == BorrowingStatus.ACTIVE, Borrowing.due_date >= now)
        base_query = base_query.where(cond)
        count_query = count_query.where(cond)
    elif s_filter == "returned":
        if is_full_history:
            base_query = base_query.where(Borrowing.status == BorrowingStatus.RETURNED)
            count_query = count_query.where(Borrowing.status == BorrowingStatus.RETURNED)
        else:
            cond = and_(
                Borrowing.status == BorrowingStatus.RETURNED,
                func.coalesce(Borrowing.returned_at, Borrowing.return_date) >= seven_days_ago,
            )
            base_query = base_query.where(cond)
            count_query = count_query.where(cond)
    elif s_filter == "archived_7d":
        cond = and_(
            Borrowing.status == BorrowingStatus.RETURNED,
            func.coalesce(Borrowing.returned_at, Borrowing.return_date) >= seven_days_ago,
        )
        base_query = base_query.where(cond)
        count_query = count_query.where(cond)
    elif s_filter == "open":
        cond = Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE])
        base_query = base_query.where(cond)
        count_query = count_query.where(cond)
    else:
        if not is_full_history:
            cond = or_(
                Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE]),
                and_(
                    Borrowing.status == BorrowingStatus.RETURNED,
                    func.coalesce(Borrowing.returned_at, Borrowing.return_date) >= seven_days_ago,
                ),
            )
            base_query = base_query.where(cond)
            count_query = count_query.where(cond)

    if b_type:
        base_query = base_query.where(Borrowing.borrower_type == b_type)
        count_query = count_query.where(Borrowing.borrower_type == b_type)

    if b_id:
        base_query = base_query.where(Borrowing.borrower_id == b_id)
        count_query = count_query.where(Borrowing.borrower_id == b_id)

    if q_str:
        term = f"%{q_str}%"
        matching_students = select(Student.id).where(Student.full_name.ilike(term))
        matching_staff = select(Staff.id).where(Staff.full_name.ilike(term))
        matching_books = select(Book.id).where(Book.title.ilike(term))

        q_filter = or_(
            Borrowing.book_id.in_(matching_books),
            and_(Borrowing.borrower_type == BorrowerType.STUDENT, Borrowing.borrower_id.in_(matching_students)),
            and_(Borrowing.borrower_type == BorrowerType.STAFF, Borrowing.borrower_id.in_(matching_staff)),
        )
        base_query = base_query.where(q_filter)
        count_query = count_query.where(q_filter)

    total_count = (await db.execute(count_query)).scalar_one()

    stmt = (
        base_query
        .order_by(
            case(
                (Borrowing.status == BorrowingStatus.OVERDUE, 1),
                (Borrowing.status == BorrowingStatus.ACTIVE, 2),
                else_=3,
            ),
            Borrowing.due_date.asc(),
            Borrowing.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    student_ids = [r.borrower_id for r in records if r.borrower_type == BorrowerType.STUDENT]
    staff_ids = [r.borrower_id for r in records if r.borrower_type == BorrowerType.STAFF]

    students_map = {}
    staff_map = {}
    if student_ids:
        s_res = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students_map = {s.id: s for s in s_res.scalars().all()}
    if staff_ids:
        st_res = await db.execute(select(Staff).where(Staff.id.in_(staff_ids)))
        staff_map = {st.id: st for st in st_res.scalars().all()}

    items = []
    for r in records:
        effective_st = resolve_effective_status(r.status, r.due_date)
        if r.borrower_type == BorrowerType.STUDENT:
            u = students_map.get(r.borrower_id)
        else:
            u = staff_map.get(r.borrower_id)

        items.append(
            BorrowingOut(
                id=r.id,
                book_id=r.book_id,
                book_title=r.book.title if r.book else "Noma'lum kitob",
                category_name=None,
                borrower_type=r.borrower_type,
                borrower_id=r.borrower_id,
                borrower_name=u.full_name if u else "Noma'lum",
                borrower_phone=u.phone if u else None,
                issue_date=r.issue_date,
                due_date=r.due_date,
                return_date=r.return_date,
                returned_at=r.returned_at,
                status=effective_st,
            )
        )

    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
