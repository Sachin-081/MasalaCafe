from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.services.permissions import require_role

from app.database import get_db
from app.schemas.user import (
    StudentSignup,
    StudentResponse,
    StudentLogin,
    AdminLogin,
    LoginResponse,
)
from app.services.auth_service import (
    register_student,
    login_student,
    login_admin,
    create_access_token,
)
from app.services.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup_student(
    data: StudentSignup,
    db: Session = Depends(get_db),
):
    try:
        student = register_student(data, db)
        return student

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )


@router.post("/login", response_model=LoginResponse)
def student_login(
    data: StudentLogin,
    db: Session = Depends(get_db),
):
    try:
        student = login_student(data, db)

        access_token = create_access_token(student)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "student": student,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        )
@router.get("/me", response_model=StudentResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.get("/student-only", response_model=StudentResponse)
def student_only(
    current_user: User = Depends(require_role("student")),
):
    return current_user

@router.post("/admin/login", response_model=LoginResponse)
def admin_login(
    data: AdminLogin,
    db: Session = Depends(get_db),
):
    try:
        admin = login_admin(data, db)

        access_token = create_access_token(admin)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "student": admin,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        )