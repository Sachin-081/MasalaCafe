from datetime import datetime

from pydantic import BaseModel, Field


class InventoryUpdate(BaseModel):
    stock_quantity: int = Field(ge=0)
    low_stock_threshold: int = Field(ge=0)
    reason: str = Field(min_length=1, max_length=255)


class InventoryItemResponse(BaseModel):
    menu_item_id: int
    name: str
    category_id: int
    category_name: str
    is_available: bool
    stock_quantity: int | None
    low_stock_threshold: int | None
    stock_status: str
    updated_at: datetime | None


class InventoryMovementResponse(BaseModel):
    id: int
    menu_item_id: int
    menu_item_name: str
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reason: str
    created_at: datetime
