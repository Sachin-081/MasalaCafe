
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse
from app.models.user import User
from app.services.permissions import require_role


router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"],
)


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
):
    return db.query(Category).order_by(Category.name).all()


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    existing_category = db.query(Category).filter(
        func.lower(Category.name) == data.name.strip().lower()
    ).first()

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists",
        )

    new_category = Category(
        name=data.name.strip(),
        description=data.description,
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category
