from datetime import date, datetime, timezone
import enum
from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class AdminRole(str, enum.Enum):
    ADMIN = "admin"
    LIBRARIAN = "librarian"


class BorrowerType(str, enum.Enum):
    STUDENT = "student"
    STAFF = "staff"


class BorrowingStatus(str, enum.Enum):
    ACTIVE = "active"
    OVERDUE = "overdue"
    RETURNED = "returned"


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[AdminRole] = mapped_column(
        Enum(AdminRole, name="admin_role_enum", native_enum=False),
        default=AdminRole.LIBRARIAN,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    books: Mapped[list["Book"]] = relationship("Book", back_populates="category", cascade="all, delete-orphan")


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    total_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    available_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    category: Mapped["Category"] = relationship("Category", back_populates="books")
    borrowings: Mapped[list["Borrowing"]] = relationship("Borrowing", back_populates="book")

    __table_args__ = (
        CheckConstraint("total_qty >= 0", name="chk_books_total_qty_non_negative"),
        CheckConstraint("available_qty >= 0", name="chk_books_available_qty_non_negative"),
        CheckConstraint("available_qty <= total_qty", name="chk_books_available_lte_total"),
    )


class EducationType(Base):
    __tablename__ = "education_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    students: Mapped[list["Student"]] = relationship("Student", back_populates="education_type")


class EducationForm(Base):
    __tablename__ = "education_forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    students: Mapped[list["Student"]] = relationship("Student", back_populates="education_form")


class Specialty(Base):
    __tablename__ = "specialties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    students: Mapped[list["Student"]] = relationship("Student", back_populates="specialty")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    students: Mapped[list["Student"]] = relationship("Student", back_populates="course")


class StudyGroup(Base):
    __tablename__ = "study_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    students: Mapped[list["Student"]] = relationship("Student", back_populates="group_rel")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    education_type_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("education_types.id", ondelete="SET NULL"), nullable=True, index=True
    )
    education_form_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("education_forms.id", ondelete="SET NULL"), nullable=True, index=True
    )
    specialty_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("specialties.id", ondelete="SET NULL"), nullable=True, index=True
    )
    course_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True
    )
    group_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("study_groups.id", ondelete="SET NULL"), nullable=True, index=True
    )

    major: Mapped[str | None] = mapped_column(String(100), nullable=True)
    group: Mapped[str | None] = mapped_column(String(50), nullable=True)

    borrow_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    education_type: Mapped[EducationType | None] = relationship("EducationType", back_populates="students")
    education_form: Mapped[EducationForm | None] = relationship("EducationForm", back_populates="students")
    specialty: Mapped[Specialty | None] = relationship("Specialty", back_populates="students")
    course: Mapped[Course | None] = relationship("Course", back_populates="students")
    group_rel: Mapped[StudyGroup | None] = relationship("StudyGroup", back_populates="students")


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    borrow_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Borrowing(Base):
    __tablename__ = "borrowings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("books.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    borrower_type: Mapped[BorrowerType] = mapped_column(
        Enum(BorrowerType, name="borrower_type_enum", native_enum=False),
        nullable=False,
        index=True,
    )
    borrower_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    issue_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    return_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    status: Mapped[BorrowingStatus] = mapped_column(
        Enum(BorrowingStatus, name="borrowing_status_enum", native_enum=False),
        default=BorrowingStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    book: Mapped["Book"] = relationship("Book", back_populates="borrowings")

    __table_args__ = (
        Index("idx_borrower_lookup", "borrower_type", "borrower_id", "status"),
        Index("idx_borrowings_status_due_date", "status", "due_date"),
    )
