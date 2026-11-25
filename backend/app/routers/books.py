import io
import openpyxl
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import get_current_admin
from ..database import get_db
from ..models import Admin, Book, Borrowing, BorrowingStatus, Category
from ..schemas import (
    BookCreate,
    BookDropdownItem,
    BookOut,
    BookUpdate,
    CategoryCreate,
    CategoryOut,
    ExcelImportResult,
    ExcelImportRowError,
    PaginatedResponse,
)
from ..search_utils import build_trgm_filter, python_difflib_rank, tokenize_query

router = APIRouter(prefix="/books", tags=["Books & Categories"])

@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = select(Category).order_by(Category.name.asc())
    result = await db.execute(stmt)
    return [CategoryOut.model_validate(c) for c in result.scalars().all()]

@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = select(Category).where(Category.name == payload.name.strip())
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category already exists")

    cat = Category(name=payload.name.strip())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)

@router.get("/search", response_model=list[BookDropdownItem])
@router.get("/search-dropdown", response_model=list[BookDropdownItem])
async def search_books(
    q: str = Query(..., min_length=1),
    category_id: int | None = Query(None),
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    query_str = q.strip()
    if not query_str:
        return []

    trgm_clause = build_trgm_filter(Book.title, query_str)
    base_stmt = select(Book).options(selectinload(Book.category))
    if isinstance(category_id, int):
        base_stmt = base_stmt.where(Book.category_id == category_id)

    books: list[Book] = []
    try:
        stmt = (
            base_stmt
            .where(trgm_clause)
            .order_by((Book.available_qty > 0).desc(), func.similarity(Book.title, query_str).desc())
            .limit(limit)
        )
        res = await db.execute(stmt)
        books = list(res.scalars().all())
    except Exception:
        words = tokenize_query(query_str)
        ilike_clauses = [Book.title.ilike(f"%{w}%") for w in words]
        stmt = base_stmt.where(and_(*ilike_clauses)).limit(50)
        res = await db.execute(stmt)
        candidates = list(res.scalars().all())
        if not candidates:
            broad_stmt = base_stmt.order_by(Book.id.desc()).limit(200)
            candidates = list((await db.execute(broad_stmt)).scalars().all())
        books = python_difflib_rank(query_str, candidates, lambda b: b.title, limit=limit)

    return [
        BookDropdownItem(
            id=b.id,
            title=b.title,
            category_id=b.category_id,
            category_name=b.category.name if b.category else None,
            available_qty=b.available_qty,
            is_available=(b.available_qty > 0),
        )
        for b in books
    ]

@router.get("", response_model=PaginatedResponse[BookOut])
async def list_books(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    q: str | None = Query(None),
    category_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    offset = (page - 1) * limit

    base_query = select(Book)
    count_query = select(func.count(Book.id))

    if q and q.strip():
        filter_q = Book.title.ilike(f"%{q.strip()}%")
        base_query = base_query.where(filter_q)
        count_query = count_query.where(filter_q)

    if category_id:
        base_query = base_query.where(Book.category_id == category_id)
        count_query = count_query.where(Book.category_id == category_id)

    total_count = (await db.execute(count_query)).scalar_one()

    stmt = (
        base_query.options(selectinload(Book.category))
        .order_by(Book.id.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    books = result.scalars().all()

    items = [
        BookOut(
            id=b.id,
            category_id=b.category_id,
            category_name=b.category.name if b.category else None,
            title=b.title,
            total_qty=b.total_qty,
            available_qty=b.available_qty,
        )
        for b in books
    ]

    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )

@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
async def create_book(
    payload: BookCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    cat_stmt = select(Category).where(Category.id == payload.category_id)
    cat_res = await db.execute(cat_stmt)
    category = cat_res.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    book = Book(
        category_id=payload.category_id,
        title=payload.title.strip(),
        total_qty=payload.total_qty,
        available_qty=payload.total_qty,
    )
    db.add(book)
    await db.commit()
    await db.refresh(book)

    return BookOut(
        id=book.id,
        category_id=book.category_id,
        category_name=category.name,
        title=book.title,
        total_qty=book.total_qty,
        available_qty=book.available_qty,
    )

@router.put("/{book_id}", response_model=BookOut)
async def update_book(
    book_id: int,
    payload: BookUpdate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = select(Book).options(selectinload(Book.category)).where(Book.id == book_id).with_for_update()
    res = await db.execute(stmt)
    book = res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    new_category_id = payload.category_id if payload.category_id is not None else book.category_id
    cat_stmt = select(Category).where(Category.id == new_category_id)
    cat_res = await db.execute(cat_stmt)
    category = cat_res.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    new_total_qty = payload.total_qty if payload.total_qty is not None else book.total_qty
    currently_borrowed = book.total_qty - book.available_qty
    if new_total_qty < currently_borrowed:
        raise HTTPException(
            status_code=400,
            detail=f"Mavjud zaxirani {currently_borrowed} tadan kamaytirib bo'lmaydi, chunki {currently_borrowed} ta nusxa hozirda ijarada.",
        )

    book.title = payload.title.strip() if payload.title is not None else book.title
    book.category_id = new_category_id
    book.total_qty = new_total_qty
    book.available_qty = new_total_qty - currently_borrowed

    await db.commit()
    await db.refresh(book)

    return BookOut(
        id=book.id,
        category_id=book.category_id,
        category_name=category.name,
        title=book.title,
        total_qty=book.total_qty,
        available_qty=book.available_qty,
    )

@router.delete("/{book_id}")
async def delete_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    stmt = select(Book).where(Book.id == book_id).with_for_update()
    res = await db.execute(stmt)
    book = res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    currently_borrowed = book.total_qty - book.available_qty
    if currently_borrowed > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete book with active borrowings",
        )

    active_loans_check = select(func.count(Borrowing.id)).where(
        Borrowing.book_id == book_id,
        Borrowing.status.in_([BorrowingStatus.ACTIVE, BorrowingStatus.OVERDUE]),
    )
    active_count = (await db.execute(active_loans_check)).scalar_one()
    if active_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete book with active borrowings",
        )

    await db.execute(delete(Borrowing).where(Borrowing.book_id == book_id))
    await db.delete(book)
    await db.commit()

    return {"message": "Book deleted successfully", "id": book_id}

@router.post("/import-excel", response_model=ExcelImportResult)
async def import_books_from_excel(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx Excel files are supported",
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must not exceed 5 MB")

    if not content.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=400, detail="Invalid Excel file: missing zip header")

    try:
        workbook = openpyxl.load_workbook(filename=io.BytesIO(content), data_only=True)
        sheet = workbook.active
        if not sheet:
            raise HTTPException(status_code=400, detail="No active sheet found in Excel file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {str(e)}")

    all_rows = list(sheet.iter_rows(min_row=2, values_only=True))
    if len(all_rows) > 5000:
        raise HTTPException(status_code=400, detail="Maximum 5000 rows allowed per import")

    total_rows = 0
    imported_count = 0
    failed_count = 0
    errors: list[ExcelImportRowError] = []

    categories_res = await db.execute(select(Category.id))
    valid_category_ids = set(categories_res.scalars().all())

    for row_idx, row in enumerate(all_rows, start=2):
        if not row or all(v is None for v in row):
            continue

        total_rows += 1
        title, cat_id_val, qty_val = (row[0], row[1], row[2]) if len(row) >= 3 else (None, None, None)

        if not title or not str(title).strip():
            failed_count += 1
            errors.append(ExcelImportRowError(row_number=row_idx, reason="Title is empty"))
            continue

        try:
            category_id = int(cat_id_val)
            if category_id not in valid_category_ids:
                failed_count += 1
                errors.append(
                    ExcelImportRowError(row_number=row_idx, reason=f"Category ID {category_id} does not exist")
                )
                continue
        except (ValueError, TypeError):
            failed_count += 1
            errors.append(ExcelImportRowError(row_number=row_idx, reason="Invalid category_id format"))
            continue

        try:
            total_qty = int(qty_val)
            if total_qty < 0:
                failed_count += 1
                errors.append(ExcelImportRowError(row_number=row_idx, reason="Quantity cannot be negative"))
                continue
        except (ValueError, TypeError):
            failed_count += 1
            errors.append(ExcelImportRowError(row_number=row_idx, reason="Invalid total_qty format"))
            continue

        clean_title = str(title).strip()
        book = Book(
            category_id=category_id,
            title=clean_title,
            total_qty=total_qty,
            available_qty=total_qty,
        )
        db.add(book)
        imported_count += 1

    await db.commit()

    return ExcelImportResult(
        total_rows=total_rows,
        imported_count=imported_count,
        failed_count=failed_count,
        errors=errors[:100],
    )
