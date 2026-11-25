from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_password_hash, require_admin_role
from ..database import get_db
from ..models import Admin, AdminRole
from ..schemas import AdminCreate, AdminOut, AdminPasswordUpdate, AdminUpdate

router = APIRouter(prefix="/admins", tags=["Admins"])


@router.get("", response_model=list[AdminOut])
async def list_admins(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_admin_role(AdminRole.ADMIN)),
):
    stmt = select(Admin).order_by(Admin.id.asc())
    result = await db.execute(stmt)
    return [AdminOut.model_validate(admin) for admin in result.scalars().all()]


@router.post("", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: AdminCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_admin_role(AdminRole.ADMIN)),
):
    existing = await db.execute(select(Admin).where(Admin.username == payload.username))
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


@router.put("/{admin_id}", response_model=AdminOut)
async def update_admin(
    admin_id: int,
    payload: AdminUpdate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_admin_role(AdminRole.ADMIN)),
):
    res = await db.execute(select(Admin).where(Admin.id == admin_id).with_for_update())
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")

    if payload.username != target.username:
        dup = await db.execute(
            select(Admin).where(Admin.username == payload.username, Admin.id != admin_id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already registered")

    if target.role == AdminRole.ADMIN and payload.role != AdminRole.ADMIN:
        admin_count_res = await db.execute(
            select(func.count(Admin.id)).where(Admin.role == AdminRole.ADMIN)
        )
        if (admin_count_res.scalar() or 0) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the last remaining admin",
            )

    target.username = payload.username
    target.role = payload.role
    await db.commit()
    await db.refresh(target)
    return AdminOut.model_validate(target)


@router.patch("/{admin_id}/password", status_code=status.HTTP_200_OK)
async def update_admin_password(
    admin_id: int,
    payload: AdminPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_admin_role(AdminRole.ADMIN)),
):
    res = await db.execute(select(Admin).where(Admin.id == admin_id).with_for_update())
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")

    target.password_hash = get_password_hash(payload.password)
    await db.commit()
    return {"message": "Password updated successfully"}


@router.delete("/{admin_id}", status_code=status.HTTP_200_OK)
async def delete_admin(
    admin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Admin = Depends(require_admin_role(AdminRole.ADMIN)),
):
    if admin_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    res = await db.execute(select(Admin).where(Admin.id == admin_id).with_for_update())
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")

    if target.role == AdminRole.ADMIN:
        admin_count_res = await db.execute(
            select(func.count(Admin.id)).where(Admin.role == AdminRole.ADMIN)
        )
        if (admin_count_res.scalar() or 0) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last remaining admin",
            )

    await db.delete(target)
    await db.commit()
    return {"message": "Admin deleted successfully"}
