from datetime import datetime, timedelta, timezone
import jwt

from app.config import settings

from app.schemas.user import StudentSignup, StudentLogin, AdminLogin, KitchenUserCreate
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from app.models.user import User

password_hash = PasswordHash.recommended()


def register_student(data: StudentSignup, db: Session):
    # Check whether the registration number already exists
    existing_student = db.query(User).filter(
        User.registration_number == data.registration_number
    ).first()

    if existing_student:
        raise ValueError("Registration number already registered")

    # Check whether the email is already registered
    existing_email = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_email:
        raise ValueError("Email already registered")

    # Convert the DOB into a secure password hash
    hashed_password = password_hash.hash(data.dob)

    # Create a new student record
    new_student = User(
        name=data.name,
        registration_number=data.registration_number,
        email=data.email,
        password_hash=hashed_password,
        role="student",
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student

def login_student(data: StudentLogin, db: Session):
    # Find the student using their registration number
    student = db.query(User).filter(
        User.registration_number == data.registration_number
    ).first()

    # Reject unknown registration numbers
    if not student:
        raise ValueError("Invalid registration number or DOB")

    # Verify the submitted DOB against the stored hash
    if not password_hash.verify(data.dob, student.password_hash):
        raise ValueError("Invalid registration number or DOB")

    # Only student accounts can use this login endpoint
    if student.role != "student":
        raise ValueError("Invalid registration number or DOB")

    return student

def login_admin(data: AdminLogin, db: Session):
    admin = db.query(User).filter(
        User.registration_number == data.registration_number
    ).first()

    if not admin:
        raise ValueError("Invalid admin ID or password")

    if admin.role != "admin":
        raise ValueError("Invalid admin ID or password")

    if not password_hash.verify(data.password, admin.password_hash):
        raise ValueError("Invalid admin ID or password")

    return admin


def register_kitchen_user(data: KitchenUserCreate, db: Session):
    existing_user = db.query(User).filter(
        (User.registration_number == data.registration_number)
        | (User.email == data.email)
    ).first()

    if existing_user:
        raise ValueError("Registration number or email already registered")

    kitchen_user = User(
        name=data.name,
        registration_number=data.registration_number,
        email=data.email,
        password_hash=password_hash.hash(data.password),
        role="kitchen",
    )

    db.add(kitchen_user)
    db.commit()
    db.refresh(kitchen_user)
    return kitchen_user


def login_kitchen(data: AdminLogin, db: Session):
    kitchen_user = db.query(User).filter(
        User.registration_number == data.registration_number
    ).first()

    if (
        not kitchen_user
        or kitchen_user.role != "kitchen"
        or not password_hash.verify(data.password, kitchen_user.password_hash)
    ):
        raise ValueError("Invalid kitchen ID or password")

    return kitchen_user


def create_access_token(student: User):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(student.id),
        "role": student.role,
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    return token
