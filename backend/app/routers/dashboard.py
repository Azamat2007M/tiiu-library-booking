from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_admin
from ..database import get_db
from ..models import Admin, Book, Borrowing, BorrowingStatus, Category, Staff, Student
from ..schemas import CategoryStats, DashboardSummary
from .borrowings import update_overdue_statuses

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardSummary)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    await update_overdue_statuses(db)

    book_totals = await db.execute(
        select(
            func.coalesce(func.sum(Book.total_qty), 0),
            func.coalesce(func.sum(Book.available_qty), 0),
        )
    )
    total_books, total_available = book_totals.one()

    borrowed_res = await db.execute(
        select(func.count(Borrowing.id)).where(
            Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE])
        )
    )
    total_borrowed = borrowed_res.scalar_one()

    overdue_res = await db.execute(
        select(func.count(Borrowing.id)).where(Borrowing.status == BorrowingStatus.OVERDUE)
    )
    total_overdue = overdue_res.scalar_one()

    students_count = (await db.execute(select(func.count(Student.id)))).scalar_one()
    staff_count = (await db.execute(select(func.count(Staff.id)))).scalar_one()

    cat_stmt = (
        select(
            Category.id,
            Category.name,
            func.coalesce(func.sum(Book.total_qty), 0).label("tot"),
            func.coalesce(func.sum(Book.available_qty), 0).label("avail"),
        )
        .outerjoin(Book, Book.category_id == Category.id)
        .group_by(Category.id, Category.name)
        .order_by(Category.name.asc())
    )
    cat_res = await db.execute(cat_stmt)
    cat_rows = cat_res.all()

    categories_stats: list[CategoryStats] = []
    for cid, cname, tot, avail in cat_rows:
        borrowed = tot - avail
        categories_stats.append(
            CategoryStats(
                category_id=cid,
                category_name=cname,
                total_qty=int(tot),
                available_qty=int(avail),
                borrowed_qty=max(0, int(borrowed)),
            )
        )

    return DashboardSummary(
        total_books=int(total_books),
        total_available=int(total_available),
        total_borrowed=int(total_borrowed),
        total_overdue=int(total_overdue),
        total_students=int(students_count),
        total_staff=int(staff_count),
        categories=categories_stats,
    )
