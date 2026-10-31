from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.schemas.analytics import (
    AnalyticsResponse,
    AnalyticsSummary,
    BestSellingItem,
    CategorySales,
    RevenuePoint,
)


REVENUE_STATUS_DEFINITION = (
    "Revenue includes completed orders only. Pending, preparing, ready, and "
    "cancelled orders are excluded. Item revenue uses the unit price stored "
    "on each order item."
)


def _completed_order_filters(start_date: date, end_date: date):
    return (
        func.lower(Order.status) == "completed",
        func.date(Order.created_at) >= start_date,
        func.date(Order.created_at) <= end_date,
    )


def get_analytics(start_date: date, end_date: date, db: Session) -> AnalyticsResponse:
    filters = _completed_order_filters(start_date, end_date)
    completed_order_count = (
        db.query(func.count(Order.id))
        .filter(*filters)
        .scalar()
        or 0
    )

    revenue_expression = OrderItem.unit_price * OrderItem.quantity
    total_revenue = (
        db.query(func.coalesce(func.sum(revenue_expression), 0))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(*filters)
        .scalar()
    )
    total_revenue = Decimal(total_revenue or 0)
    average_order_value = (
        total_revenue / completed_order_count
        if completed_order_count
        else Decimal("0.00")
    )

    daily_rows = (
        db.query(
            func.date(Order.created_at).label("order_date"),
            func.coalesce(func.sum(revenue_expression), 0).label("revenue"),
            func.count(func.distinct(Order.id)).label("order_count"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(*filters)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    item_rows = (
        db.query(
            MenuItem.id,
            MenuItem.name,
            func.sum(OrderItem.quantity).label("quantity"),
            func.coalesce(func.sum(revenue_expression), 0).label("revenue"),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(*filters)
        .group_by(MenuItem.id, MenuItem.name)
        .order_by(func.sum(OrderItem.quantity).desc(), MenuItem.name)
        .all()
    )

    category_rows = (
        db.query(
            Category.id,
            Category.name,
            func.sum(OrderItem.quantity).label("quantity"),
            func.coalesce(func.sum(revenue_expression), 0).label("revenue"),
        )
        .join(MenuItem, MenuItem.category_id == Category.id)
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(*filters)
        .group_by(Category.id, Category.name)
        .order_by(func.sum(revenue_expression).desc(), Category.name)
        .all()
    )

    return AnalyticsResponse(
        summary=AnalyticsSummary(
            start_date=start_date,
            end_date=end_date,
            total_revenue=total_revenue,
            completed_order_count=completed_order_count,
            average_order_value=average_order_value,
            revenue_status_definition=REVENUE_STATUS_DEFINITION,
        ),
        revenue_over_time=[
            RevenuePoint(
                date=str(row.order_date),
                revenue=Decimal(row.revenue or 0),
                order_count=row.order_count,
            )
            for row in daily_rows
        ],
        best_selling_items=[
            BestSellingItem(
                menu_item_id=row.id,
                name=row.name,
                quantity=row.quantity,
                revenue=Decimal(row.revenue or 0),
            )
            for row in item_rows
        ],
        sales_by_category=[
            CategorySales(
                category_id=row.id,
                name=row.name,
                quantity=row.quantity,
                revenue=Decimal(row.revenue or 0),
            )
            for row in category_rows
        ],
    )