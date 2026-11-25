from collections import defaultdict
import time
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import create_access_token, get_current_admin, get_password_hash, require_admin_role, verify_password
from ..database import get_db
from ..models import Admin, AdminRole
from ..schemas import AdminCreate, AdminOut, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

failed_login_attempts: dict[str, list[float]] = defaultdict(list)

def check_login_rate_limit(client_ip: str):
    now = time.time()
    cutoff = now - 60.0
    attempts = [t for t in failed_login_attempts[client_ip] if t > cutoff]
    failed_login_attempts[client_ip] = attempts
    if len(attempts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again after 1 minute.",
        )

def record_failed_attempt(client_ip: str):
    failed_login_attempts[client_ip].append(time.time())

def clear_failed_attempts(client_ip: str):
    failed_login_attempts.pop(client_ip, None)

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_ip)

    stmt = select(Admin).where(Admin.username == form_data.username)
    result = await db.execute(stmt)
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(form_data.password, admin.password_hash):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clear_failed_attempts(client_ip)

    access_token = create_access_token(data={"sub": str(admin.id), "role": admin.role.value})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=AdminOut.model_validate(admin),
    )

@router.get("/me", response_model=AdminOut)
async def read_users_me(current_admin: Admin = Depends(get_current_admin)):
    return AdminOut.model_validate(current_admin)

@router.post("/register", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: AdminCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_admin_role(AdminRole.ADMIN)),
):
    stmt = select(Admin).where(Admin.username == payload.username)
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")

    new_admin = Admin(
        username=payload.username,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)
    return AdminOut.model_validate(new_admin)

@router.get("/admins", response_model=list[AdminOut])
async def list_admins(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_admin_role(AdminRole.ADMIN)),
):
    stmt = select(Admin).order_by(Admin.id.asc())
    result = await db.execute(stmt)
    return [AdminOut.model_validate(admin) for admin in result.scalars().all()]
