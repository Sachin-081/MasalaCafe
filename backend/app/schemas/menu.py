
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class MenuItemCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    category_id: int = Field(gt=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_available: bool = True


class MenuItemResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: Decimal
    category_id: int
    image_url: str | None
    is_available: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
class MenuItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    price: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=2,
    )
    category_id: int | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_available: bool | None = None