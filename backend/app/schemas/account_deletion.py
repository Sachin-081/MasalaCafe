from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AccountDeletionReview(BaseModel):
    status: Literal["approved", "rejected"]
    admin_note: str | None = Field(default=None, max_length=2000)


class AccountDeletionRequestResponse(BaseModel):
    id: int
    student_id: int
    student_name: str | None = None
    registration_number: str | None = None
    requested_at: datetime
    status: Literal["pending", "approved", "rejected"]
    admin_note: str | None
    reviewed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
