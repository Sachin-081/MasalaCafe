from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.models.inventory import InventoryMovement, InventoryStock
from app.models.menu import MenuItem
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemResponse,
    InventoryMovementResponse,
    InventoryUpdate,
)
from app.services.permissions import require_role


router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"],
)


def _stock_status(stock_quantity: int | None, threshold: int | None) -> str:
    if stock_quantity is None or threshold is None:
        return "untracked"
    if stock_quantity == 0:
        return "out_of_stock"
    if stock_quantity <= threshold:
        return "low_stock"
    return "in_stock"


@router.get("/", response_model=list[InventoryItemResponse])
def get_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    rows = (
        db.query(MenuItem, Category, InventoryStock)
        .join(Category, Category.id == MenuItem.category_id)
        .outerjoin(InventoryStock, InventoryStock.menu_item_id == MenuItem.id)
        .order_by(MenuItem.name)
        .all()
    )

    return [
        InventoryItemResponse(
            menu_item_id=item.id,
            name=item.name,
            category_id=category.id,
            category_name=category.name,
            is_available=item.is_available,
            stock_quantity=stock.stock_quantity if stock else None,
            low_stock_threshold=stock.low_stock_threshold if stock else None,
            stock_status=_stock_status(
                stock.stock_quantity if stock else None,
                stock.low_stock_threshold if stock else None,
            ),
            updated_at=stock.updated_at if stock else None,
        )
        for item, category, stock in rows
    ]


@router.get("/movements", response_model=list[InventoryMovementResponse])
def get_inventory_movements(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    rows = (
        db.query(InventoryMovement, InventoryStock, MenuItem)
        .join(InventoryStock, InventoryStock.id == InventoryMovement.inventory_id)
        .join(MenuItem, MenuItem.id == InventoryStock.menu_item_id)
        .order_by(InventoryMovement.created_at.desc(), InventoryMovement.id.desc())
        .limit(limit)
        .all()
    )
    return [
        InventoryMovementResponse(
            id=movement.id,
            menu_item_id=item.id,
            menu_item_name=item.name,
            quantity_change=movement.quantity_change,
            quantity_before=movement.quantity_before,
            quantity_after=movement.quantity_after,
            reason=movement.reason,
            created_at=movement.created_at,
        )
        for movement, _stock, item in rows
    ]


@router.put("/{menu_item_id}", response_model=InventoryItemResponse)
def update_inventory(
    menu_item_id: int,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    reason = data.reason.strip()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="reason must contain at least one non-whitespace character",
        )

    item = (
        db.query(MenuItem)
        .filter(MenuItem.id == menu_item_id)
        .with_for_update()
        .first()
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    stock = (
        db.query(InventoryStock)
        .filter(InventoryStock.menu_item_id == menu_item_id)
        .with_for_update()
        .first()
    )
    is_initial_stock = stock is None
    if is_initial_stock:
        stock = InventoryStock(
            menu_item_id=menu_item_id,
            stock_quantity=0,
            low_stock_threshold=data.low_stock_threshold,
        )
        db.add(stock)
        db.flush()

    previous_quantity = stock.stock_quantity
    new_quantity = data.stock_quantity
    stock.stock_quantity = new_quantity
    stock.low_stock_threshold = data.low_stock_threshold

    if new_quantity == 0:
        if is_initial_stock or previous_quantity > 0:
            stock.availability_before_stockout = item.is_available
        item.is_available = False
    elif stock.availability_before_stockout is not None:
        item.is_available = stock.availability_before_stockout
        stock.availability_before_stockout = None

    if is_initial_stock or previous_quantity != new_quantity:
        db.add(
            InventoryMovement(
                inventory_id=stock.id,
                quantity_change=new_quantity - previous_quantity,
                quantity_before=previous_quantity,
                quantity_after=new_quantity,
                reason=reason,
            )
        )

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Inventory could not be updated due to a conflicting database change",
        ) from error

    db.refresh(item)
    db.refresh(stock)
    category = db.query(Category).filter(Category.id == item.category_id).one()
    return InventoryItemResponse(
        menu_item_id=item.id,
        name=item.name,
        category_id=category.id,
        category_name=category.name,
        is_available=item.is_available,
        stock_quantity=stock.stock_quantity,
        low_stock_threshold=stock.low_stock_threshold,
        stock_status=_stock_status(stock.stock_quantity, stock.low_stock_threshold),
        updated_at=stock.updated_at,
    )