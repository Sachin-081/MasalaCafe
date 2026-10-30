
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class StudentSignup(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    registration_number: str = Field(min_length=3, max_length=30)
    email: EmailStr
    dob: str = Field(pattern=r"^\d{8}$")

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, value):
        try:
            datetime.strptime(value, "%d%m%Y")
        except ValueError:
            raise ValueError("DOB must be a valid date in DDMMYYYY format")

        return value


class StudentResponse(BaseModel):
    id: int
    name: str
    registration_number: str
    email: EmailStr
    role: str

class StudentLogin(BaseModel):
    registration_number: str = Field(
        min_length=3,
        max_length=30,
    )

    dob: str = Field(pattern=r"^\d{8}$")


class AdminLogin(BaseModel):
    registration_number: str = Field(
        min_length=3,
        max_length=30,
    )
    password: str = Field(
        min_length=8,
        max_length=128,
    )


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student: StudentResponse
