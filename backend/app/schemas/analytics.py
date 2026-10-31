from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    start_date: date
    end_date: date
    total_revenue: Decimal
    completed_order_count: int
    average_order_value: Decimal
    revenue_status_definition: str


class RevenuePoint(BaseModel):
    date: str
    revenue: Decimal
    order_count: int


class BestSellingItem(BaseModel):
    menu_item_id: int
    name: str
    quantity: int
    revenue: Decimal


class CategorySales(BaseModel):
    category_id: int
    name: str
    quantity: int
    revenue: Decimal


class AnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    revenue_over_time: list[RevenuePoint]
    best_selling_items: list[BestSellingItem]
    sales_by_category: list[CategorySales]
