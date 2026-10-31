from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.account_deletion import AccountDeletionRequest
from app.models.user import User


def _request_with_student(request, student):
    request.student_name = student.name
    request.registration_number = student.registration_number
    return request


def submit_request(student_id: int, db: Session):
    student = (
        db.query(User)
        .filter(User.id == student_id, User.role == "student")
        .with_for_update()
        .first()
    )
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student account not found",
        )

    pending = (
        db.query(AccountDeletionRequest)
        .filter(
            AccountDeletionRequest.student_id == student_id,
            AccountDeletionRequest.status == "pending",
        )
        .first()
    )
    if pending is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending account deletion request.",
        )

    request = AccountDeletionRequest(student_id=student_id, status="pending")
    db.add(request)
    try:
        db.commit()
        db.refresh(request)
        return _request_with_student(request, student)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending account deletion request.",
        ) from error
    except Exception:
        db.rollback()
        raise


def list_student_requests(student_id: int, db: Session):
    rows = (
        db.query(AccountDeletionRequest)
        .filter(AccountDeletionRequest.student_id == student_id)
        .order_by(
            AccountDeletionRequest.requested_at.desc(),
            AccountDeletionRequest.id.desc(),
        )
        .all()
    )
    student = db.query(User).filter(User.id == student_id).first()
    return [_request_with_student(row, student) for row in rows]


def cancel_student_request(request_id: int, student_id: int, db: Session):
    request = (
        db.query(AccountDeletionRequest)
        .filter(
            AccountDeletionRequest.id == request_id,
            AccountDeletionRequest.student_id == student_id,
        )
        .with_for_update()
        .first()
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account deletion request not found",
        )
    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending account deletion requests can be cancelled.",
        )

    db.delete(request)
    db.commit()
    return {"message": "Pending account deletion request cancelled"}


def list_admin_requests(status_filter: str | None, db: Session):
    query = (
        db.query(AccountDeletionRequest, User)
        .join(User, User.id == AccountDeletionRequest.student_id)
        .order_by(
            AccountDeletionRequest.requested_at.desc(),
            AccountDeletionRequest.id.desc(),
        )
    )
    if status_filter is not None:
        query = query.filter(AccountDeletionRequest.status == status_filter)
    return [
        _request_with_student(request, student)
        for request, student in query.all()
    ]


def review_request(
    request_id: int,
    decision: str,
    admin_note: str | None,
    db: Session,
):
    request = (
        db.query(AccountDeletionRequest)
        .filter(AccountDeletionRequest.id == request_id)
        .with_for_update()
        .first()
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account deletion request not found",
        )
    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending account deletion requests can be reviewed.",
        )

    request.status = decision
    request.admin_note = admin_note.strip() if admin_note is not None else None
    if request.admin_note == "":
        request.admin_note = None
    request.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(request)
    student = db.query(User).filter(User.id == request.student_id).one()
    return _request_with_student(request, student)
