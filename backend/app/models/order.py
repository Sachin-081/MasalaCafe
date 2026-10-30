
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    func,
)

from app.database import Base
from sqlalchemy.orm import relationship

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    token_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    total_amount = Column(
        Numeric(10, 2),
        nullable=False,
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    items = relationship(
    "OrderItem",
    back_populates="order",
    cascade="all, delete-orphan",
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False,
        index=True,
    )

    menu_item_id = Column(
        Integer,
        ForeignKey("menu_items.id"),
        nullable=False,
        index=True,
    )

    quantity = Column(
        Integer,
        nullable=False,
    )

    unit_price = Column(
        Numeric(10, 2),
        nullable=False,
    )

    subtotal = Column(
        Numeric(10, 2),
        nullable=False,
    )
    order = relationship(
    "Order",
    back_populates="items",
    )
