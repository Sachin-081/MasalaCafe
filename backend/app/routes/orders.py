
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse

from app.services.permissions import require_role
from app.services.order_service import (
    create_order,
    get_student_orders,
    get_all_orders,
)
from pydantic import BaseModel, Field
from typing import Literal

from app.services.order_service import update_order_status

class OrderStatusUpdate(BaseModel):
    status: Literal["preparing", "ready", "completed"]

router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"],
)


@router.post("/", response_model=OrderResponse, status_code=201)
def place_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    return create_order(
        data=data,
        student_id=current_user.id,
        db=db,
    )

@router.get("/", response_model=list[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    return get_student_orders(
        student_id=current_user.id,
        db=db,
    )
@router.get("/kitchen", response_model=list[OrderResponse])
def get_kitchen_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "kitchen")),
):
    return get_all_orders(db)
@router.patch("/{order_id}/status", response_model=OrderResponse)
def change_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "kitchen")),
):
    return update_order_status(
        order_id=order_id,
        new_status=data.status,
        db=db,
    )