from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class InventoryStock(Base):
    __tablename__ = "inventory_stocks"

    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(
        Integer,
        ForeignKey("menu_items.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    stock_quantity = Column(Integer, nullable=False)
    low_stock_threshold = Column(Integer, nullable=False)
    availability_before_stockout = Column(Boolean, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(
        Integer,
        ForeignKey("inventory_stocks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity_change = Column(Integer, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )