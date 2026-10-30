
import secrets
from decimal import Decimal

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.order import Order, OrderItem
from app.models.menu import MenuItem
from app.schemas.order import OrderCreate


def create_order(data: OrderCreate, student_id: int, db: Session):
    try:
        total_amount = Decimal("0.00")
        order_items = []

        for requested_item in data.items:
            menu_item = db.query(MenuItem).filter(
                MenuItem.id == requested_item.menu_item_id
            ).with_for_update().first()

            if menu_item is None or not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more menu items are unavailable",
                )

            unit_price = menu_item.price
            subtotal = unit_price * requested_item.quantity

            total_amount += subtotal

            order_items.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    quantity=requested_item.quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                )
            )

        token_number = secrets.token_hex(4).upper()

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

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create order",
        )
def get_student_orders(student_id: int, db: Session):
    orders = (
        db.query(Order)
        .filter(Order.student_id == student_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return orders

def get_all_orders(db: Session):
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )
def update_order_status(order_id: int, new_status: str, db: Session):
    allowed_transitions = {
        "pending": ["preparing"],
        "preparing": ["ready"],
        "ready": ["completed"],
        "completed": [],
    }

    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if new_status not in allowed_transitions.get(order.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {order.status} to {new_status}",
        )

    order.status = new_status

    db.commit()
    db.refresh(order)

    return order