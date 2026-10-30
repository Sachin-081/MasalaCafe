
from getpass import getpass

from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.services.auth_service import password_hash


def create_admin():
    Base.metadata.create_all(bind=engine)

    name = input("Enter admin name: ").strip()
    registration_number = input("Enter admin ID: ").strip()
    email = input("Enter admin email: ").strip()

    password = getpass("Enter admin password: ")
    confirm_password = getpass("Confirm admin password: ")

    if not all([name, registration_number, email, password]):
        print("All fields are required.")
        return

    if password != confirm_password:
        print("Passwords do not match.")
        return

    db = SessionLocal()

    try:
        existing_admin = db.query(User).filter(
            (User.registration_number == registration_number)
            | (User.email == email)
        ).first()

        if existing_admin:
            print("An account with this ID or email already exists.")
            return

        admin = User(
            name=name,
            registration_number=registration_number,
            email=email,
            password_hash=password_hash.hash(password),
            role="admin",
        )

        db.add(admin)
        db.commit()

        print("Admin account created successfully!")

    except Exception:
        db.rollback()
        print("Could not create admin account. Check the database connection.")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
