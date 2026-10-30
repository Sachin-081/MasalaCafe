
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.menu import MenuItem
from app.models.category import Category
from app.models.user import User
from app.schemas.menu import MenuItemCreate, MenuItemResponse,MenuItemUpdate
from app.services.permissions import require_role


router = APIRouter(
    prefix="/api/menu",
    tags=["Menu"],
)


@router.get("/", response_model=list[MenuItemResponse])
def get_menu(
    category_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(MenuItem)

    if category_id is not None:
        query = query.filter(MenuItem.category_id == category_id)

    return query.order_by(MenuItem.name).all()


@router.post(
    "/",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_menu_item(
    data: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    category = db.query(Category).filter(
        Category.id == data.category_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    new_item = MenuItem(
        name=data.name.strip(),
        description=data.description,
        price=data.price,
        category_id=data.category_id,
        image_url=data.image_url,
        is_available=True,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item

@router.put("/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id
    ).first()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        category = db.query(Category).filter(
            Category.id == update_data["category_id"]
        ).first()

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    return item

@router.delete("/{item_id}")
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id
    ).first()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Menu item deleted successfully"
    }