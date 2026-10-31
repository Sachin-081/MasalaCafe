import secrets
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.inventory import InventoryMovement, InventoryStock
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate


def create_order(data: OrderCreate, student_id: int, db: Session):
    try:
        requested_quantities = {}
        for requested_item in data.items:
            requested_quantities[requested_item.menu_item_id] = (
                requested_quantities.get(requested_item.menu_item_id, 0)
                + requested_item.quantity
            )

        menu_items = (
            db.query(MenuItem)
            .filter(MenuItem.id.in_(requested_quantities))
            .order_by(MenuItem.id)
            .with_for_update()
            .all()
        )
        menu_items_by_id = {item.id: item for item in menu_items}

        if len(menu_items_by_id) != len(requested_quantities):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more menu items are unavailable",
            )

        for menu_item_id in sorted(requested_quantities):
            menu_item = menu_items_by_id[menu_item_id]
            if not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{menu_item.name} is unavailable",
                )

        inventory_rows = (
            db.query(InventoryStock)
            .filter(InventoryStock.menu_item_id.in_(requested_quantities))
            .order_by(InventoryStock.menu_item_id)
            .with_for_update()
            .all()
        )
        stock_by_menu_item_id = {
            stock.menu_item_id: stock for stock in inventory_rows
        }

        token_number = secrets.token_hex(4).upper()
        total_amount = Decimal("0.00")
        order_items = []

        for menu_item_id in sorted(requested_quantities):
            menu_item = menu_items_by_id[menu_item_id]
            quantity = requested_quantities[menu_item_id]
            stock = stock_by_menu_item_id.get(menu_item_id)

            if stock is not None:
                quantity_before = stock.stock_quantity
                if quantity_before < quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Insufficient stock for {menu_item.name}: "
                            f"requested {quantity}, available {quantity_before}."
                        ),
                    )

                updated_rows = (
                    db.query(InventoryStock)
                    .filter(
                        InventoryStock.id == stock.id,
                        InventoryStock.stock_quantity >= quantity,
                    )
                    .update(
                        {
                            InventoryStock.stock_quantity:
                                InventoryStock.stock_quantity - quantity
                        },
                        synchronize_session=False,
                    )
                )
                if updated_rows != 1:
                    available_quantity = (
                        db.query(InventoryStock.stock_quantity)
                        .filter(InventoryStock.id == stock.id)
                        .scalar()
                    )
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Insufficient stock for {menu_item.name}: "
                            f"requested {quantity}, available "
                            f"{available_quantity if available_quantity is not None else 0}."
                        ),
                    )

                db.refresh(stock)
                if stock.stock_quantity == 0:
                    stock.availability_before_stockout = menu_item.is_available
                    menu_item.is_available = False

                db.add(
                    InventoryMovement(
                        inventory_id=stock.id,
                        quantity_change=-quantity,
                        quantity_before=quantity_before,
                        quantity_after=stock.stock_quantity,
                        reason=f"Customer order {token_number}",
                    )
                )

            subtotal = menu_item.price * quantity
            total_amount += subtotal
            order_items.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    quantity=quantity,
                    unit_price=menu_item.price,
                    subtotal=subtotal,
                )
            )

        new_order = Order(
            token_number=token_number,
            student_id=student_id,
            total_amount=total_amount,
            status="pending",
            items=order_items,
        )

        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return new_order

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create order",
        ) from error


def get_student_orders(student_id: int, db: Session):
    return (
        db.query(Order)
        .filter(Order.student_id == student_id)
        .order_by(Order.created_at.desc())
        .all()
    )


def get_all_orders(db: Session):
    return db.query(Order).order_by(Order.created_at.desc()).all()


def update_order_status(order_id: int, new_status: str, db: Session):
    allowed_transitions = {
        "pending": ["preparing"],
        "preparing": ["ready"],
        "ready": ["completed"],
        "completed": [],
    }

    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    if new_status not in allowed_transitions.get(order.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {order.status} to {new_status}",
        )

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
