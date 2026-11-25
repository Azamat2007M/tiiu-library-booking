import asyncio
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

from .auth import get_password_hash
from .config import settings
from .database import Base, engine, AsyncSessionLocal
from .models import (
    Admin,
    AdminRole,
    Course,
    EducationForm,
    EducationType,
    Specialty,
    StudyGroup,
)
from .routers import admins, auth, books, borrowings, dashboard, students, users

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        migration_sqls = [
            "CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            "ALTER TABLE students ALTER COLUMN phone DROP NOT NULL;",
            "ALTER TABLE students ALTER COLUMN major DROP NOT NULL;",
            'ALTER TABLE students ALTER COLUMN "group" DROP NOT NULL;',
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date DATE;",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS education_type_id INTEGER REFERENCES education_types(id) ON DELETE SET NULL;",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS education_form_id INTEGER REFERENCES education_forms(id) ON DELETE SET NULL;",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS specialty_id INTEGER REFERENCES specialties(id) ON DELETE SET NULL;",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL;",
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES study_groups(id) ON DELETE SET NULL;",
            "CREATE INDEX IF NOT EXISTS ix_students_full_name ON students(full_name);",
            "CREATE INDEX IF NOT EXISTS ix_students_birth_date ON students(birth_date);",
            "CREATE INDEX IF NOT EXISTS ix_students_education_type_id ON students(education_type_id);",
            "CREATE INDEX IF NOT EXISTS ix_students_education_form_id ON students(education_form_id);",
            "CREATE INDEX IF NOT EXISTS ix_students_specialty_id ON students(specialty_id);",
            "CREATE INDEX IF NOT EXISTS ix_students_course_id ON students(course_id);",
            "CREATE INDEX IF NOT EXISTS ix_students_group_id ON students(group_id);",
            "CREATE INDEX IF NOT EXISTS ix_students_full_name_trgm ON students USING gin (full_name gin_trgm_ops);",
            "CREATE INDEX IF NOT EXISTS ix_books_title_trgm ON books USING gin (title gin_trgm_ops);",
            "ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;",
            "CREATE INDEX IF NOT EXISTS idx_borrowings_status_due_date ON borrowings(status, due_date);",
            "CREATE INDEX IF NOT EXISTS idx_borrowings_return_date ON borrowings(return_date);",
            "CREATE INDEX IF NOT EXISTS idx_borrowings_returned_at ON borrowings(returned_at);",
            "UPDATE borrowings SET status = 'overdue' WHERE status = 'active' AND due_date < NOW();",
        ]
        for sql in migration_sqls:
            try:
                await conn.execute(text(sql))
            except Exception as e:
                logger.warning(f"Migration statement skipped: {sql} ({e})")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Admin).limit(1))
        if not result.scalar_one_or_none():
            default_admin = Admin(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role=AdminRole.ADMIN,
            )
            session.add(default_admin)

        res = await session.execute(select(EducationType).limit(1))
        if not res.scalar_one_or_none():
            session.add_all([
                EducationType(name="Bakalavr"),
                EducationType(name="Magistr"),
            ])

        res = await session.execute(select(EducationForm).limit(1))
        if not res.scalar_one_or_none():
            session.add_all([
                EducationForm(name="Kunduzgi"),
                EducationForm(name="Sirtqi"),
                EducationForm(name="Kechki"),
                EducationForm(name="Masofaviy"),
            ])

        res = await session.execute(select(Course).limit(1))
        if not res.scalar_one_or_none():
            session.add_all([Course(name=f"{i}-kurs") for i in range(1, 6)])

        res = await session.execute(select(Specialty).limit(1))
        if not res.scalar_one_or_none():
            session.add_all([
                Specialty(name="Boshlangʻich taʼlim"),
                Specialty(name="Iqtisodiyot"),
                Specialty(name="Axborot texnologiyalari"),
                Specialty(name="Dasturiy injiniring"),
                Specialty(name="Xorijiy til va adabiyoti"),
            ])

        await session.commit()

    async def periodic_overdue_sync():
        while True:
            try:
                await asyncio.sleep(15 * 60)
                async with engine.begin() as conn:
                    await conn.execute(
                        text("UPDATE borrowings SET status = 'overdue' WHERE status = 'active' AND due_date < NOW();")
                    )
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Periodic overdue sync error: {e}")

    sync_task = asyncio.create_task(periodic_overdue_sync())

    try:
        yield
    finally:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass

is_prod = settings.ENV.lower() == "production"

app = FastAPI(
    title="Library Management API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
)

allowed_origins = [o.strip().rstrip("/") for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

app.include_router(auth.router, prefix="/api")
app.include_router(admins.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(borrowings.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
