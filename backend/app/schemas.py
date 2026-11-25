from datetime import date, datetime
import re
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import AdminRole, BorrowerType, BorrowingStatus

T = TypeVar("T")

def validate_phone_digits(v: Any) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() in ("none", "null", "nan", "-"):
        return None
    cleaned = re.sub(r"[^\d+]", "", s)
    if not re.match(r"^\+?[0-9]{7,15}$", cleaned):
        raise ValueError("Phone number must contain between 7 and 15 digits")
    return cleaned

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int = Field(ge=1, default=1)
    limit: int = Field(default=10, le=100)
    total_pages: int

class AdminLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, v: Any) -> Any:
        return v.strip() if isinstance(v, str) else v

class AdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    role: AdminRole = AdminRole.LIBRARIAN

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, v: Any) -> Any:
        return v.strip() if isinstance(v, str) else v

class AdminUpdate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    role: AdminRole

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, v: Any) -> Any:
        return v.strip() if isinstance(v, str) else v

class AdminPasswordUpdate(BaseModel):
    password: str = Field(..., min_length=6, max_length=128)

class AdminOut(BaseModel):
    id: int
    username: str
    role: AdminRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminOut

class CategoryCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(..., min_length=1, max_length=100)

class CategoryOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class BookCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    category_id: int = Field(..., ge=1)
    title: str = Field(..., min_length=1, max_length=255)
    total_qty: int = Field(..., ge=0)

class BookUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str | None = Field(None, min_length=1, max_length=255)
    category_id: int | None = Field(None, ge=1)
    total_qty: int | None = Field(None, ge=0)

class BookOut(BaseModel):
    id: int
    category_id: int
    category_name: str | None = None
    title: str
    total_qty: int
    available_qty: int

    model_config = ConfigDict(from_attributes=True)

class BookDropdownItem(BaseModel):
    id: int
    title: str
    category_id: int
    category_name: str | None = None
    available_qty: int
    is_available: bool

    model_config = ConfigDict(from_attributes=True)

class LookupItem(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class LookupsResponse(BaseModel):
    education_types: list[LookupItem]
    education_forms: list[LookupItem]
    specialties: list[LookupItem]
    courses: list[LookupItem]
    groups: list[LookupItem]

class StudentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    full_name: str = Field(..., min_length=2, max_length=150)
    birth_date: date | None = None
    phone: str | None = None
    education_type_id: int | None = None
    education_form_id: int | None = None
    specialty_id: int | None = None
    course_id: int | None = None
    group_id: int | None = None
    education_type: str | None = None
    education_form: str | None = None
    specialty: str | None = None
    course: str | None = None
    group: str | None = None
    major: str | None = None

    @field_validator("phone", mode="before")
    @classmethod
    def check_phone(cls, v: Any) -> str | None:
        return validate_phone_digits(v)

class StudentUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    full_name: str = Field(..., min_length=2, max_length=150)
    birth_date: date | None = None
    phone: str | None = None
    education_type_id: int | None = None
    education_form_id: int | None = None
    specialty_id: int | None = None
    course_id: int | None = None
    group_id: int | None = None
    education_type: str | None = None
    education_form: str | None = None
    specialty: str | None = None
    course: str | None = None
    group: str | None = None
    major: str | None = None

    @field_validator("phone", mode="before")
    @classmethod
    def check_phone(cls, v: Any) -> str | None:
        return validate_phone_digits(v)

class StudentPhoneUpdate(BaseModel):
    phone: str = Field(..., min_length=7, max_length=30)

    @field_validator("phone", mode="before")
    @classmethod
    def check_phone(cls, v: Any) -> str:
        res = validate_phone_digits(v)
        if not res:
            raise ValueError("Phone number must contain between 7 and 15 digits")
        return res

class StudentOut(BaseModel):
    id: int
    full_name: str
    birth_date: date | None = None
    phone: str | None = None
    education_type_id: int | None = None
    education_type_name: str | None = None
    education_form_id: int | None = None
    education_form_name: str | None = None
    specialty_id: int | None = None
    specialty_name: str | None = None
    course_id: int | None = None
    course_name: str | None = None
    group_id: int | None = None
    group_name: str | None = None
    major: str | None = None
    group: str | None = None
    borrow_count: int = 0
    has_overdue: bool = False
    active_borrows_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

StudentResponse = StudentOut

class StudentImportError(BaseModel):
    row_number: int
    reason: str

class StudentImportSummary(BaseModel):
    processed: int
    added: int
    updated: int
    failed: int
    errors: list[StudentImportError] = []

class StaffCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    full_name: str = Field(..., min_length=2, max_length=150)
    department: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=30)

    @field_validator("phone", mode="before")
    @classmethod
    def check_phone(cls, v: Any) -> str:
        res = validate_phone_digits(v)
        if not res:
            raise ValueError("Phone number must contain between 7 and 15 digits")
        return res

class StaffOut(BaseModel):
    id: int
    full_name: str
    department: str
    phone: str
    borrow_count: int
    has_overdue: bool = False
    active_borrows_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BorrowerOption(BaseModel):
    id: int
    borrower_type: BorrowerType
    full_name: str
    identifier: str
    phone: str | None = None
    has_overdue: bool = False

class BorrowingCreate(BaseModel):
    book_id: int = Field(..., ge=1)
    borrower_type: BorrowerType
    borrower_id: int = Field(..., ge=1)

class BorrowingBatchCreate(BaseModel):
    student_id: int = Field(..., ge=1)
    phone: str | None = None
    book_ids: list[int] = Field(..., min_length=1, max_length=5)

    @field_validator("phone", mode="before")
    @classmethod
    def check_phone(cls, v: Any) -> str | None:
        return validate_phone_digits(v)

    @field_validator("book_ids")
    @classmethod
    def check_unique_books(cls, v: list[int]) -> list[int]:
        if len(v) != len(set(v)):
            raise ValueError("Duplicate book IDs are not allowed in the same transaction")
        return v

class BorrowingOut(BaseModel):
    id: int
    book_id: int
    book_title: str
    category_name: str | None = None
    borrower_type: BorrowerType
    borrower_id: int
    borrower_name: str | None = None
    borrower_phone: str | None = None
    issue_date: datetime
    due_date: datetime
    return_date: datetime | None = None
    returned_at: datetime | None = None
    status: BorrowingStatus

    model_config = ConfigDict(from_attributes=True)

class BorrowingCountsSummary(BaseModel):
    all: int
    active: int
    overdue: int
    returned_7d: int
    full_history: int

class CategoryStats(BaseModel):
    category_id: int
    category_name: str
    total_qty: int
    available_qty: int
    borrowed_qty: int

class DashboardSummary(BaseModel):
    total_books: int
    total_available: int
    total_borrowed: int
    total_overdue: int
    total_students: int
    total_staff: int
    categories: list[CategoryStats]

class ExcelImportRowError(BaseModel):
    row_number: int
    reason: str

class ExcelImportResult(BaseModel):
    total_rows: int
    imported_count: int
    failed_count: int
    errors: list[ExcelImportRowError] = []
