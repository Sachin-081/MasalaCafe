from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.account_deletion import (
    AccountDeletionRequestResponse,
    AccountDeletionReview,
)
from app.services.account_deletion_service import (
    cancel_student_request,
    list_admin_requests,
    list_student_requests,
    review_request,
    submit_request,
)
from app.services.permissions import require_role


router = APIRouter(
    prefix="/api/account-deletion/requests",
    tags=["Account deletion requests"],
)


@router.post(
    "",
    response_model=AccountDeletionRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_account_deletion_request(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    return submit_request(current_user.id, db)


@router.get("/me", response_model=list[AccountDeletionRequestResponse])
def get_my_account_deletion_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    return list_student_requests(current_user.id, db)


@router.delete("/{request_id}")
def cancel_my_account_deletion_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    return cancel_student_request(request_id, current_user.id, db)


@router.get("", response_model=list[AccountDeletionRequestResponse])
def get_account_deletion_requests(
    request_status: Literal["pending", "approved", "rejected"] | None = Query(
        default="pending",
        alias="status",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return list_admin_requests(request_status, db)


@router.patch(
    "/{request_id}",
    response_model=AccountDeletionRequestResponse,
)
def review_account_deletion_request(
    request_id: int,
    data: AccountDeletionReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return review_request(
        request_id=request_id,
        decision=data.status,
        admin_note=data.admin_note,
        db=db,
    )
