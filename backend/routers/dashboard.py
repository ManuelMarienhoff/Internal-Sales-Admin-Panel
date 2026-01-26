from datetime import datetime
import calendar
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from database import get_db
from models import Customer, Order, OrderItem, Product, OrderStatus


router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)


def _to_float(value: Decimal | None) -> float:
    """Convert Decimal to float, handling None values."""
    if value is None:
        return 0.0
    try:
        return float(value)
    except Exception:
        return 0.0


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns comprehensive analytics for the B2B dashboard.
    
    Includes:
    - KPI Cards (active/inactive engagements, total contract value)
    - Industry Metrics (revenue and share by industry)
    - Service Line Metrics (revenue and share by service line)
    - Annual Trends (12 months for current year, grouped by service line)
    """
    
    # ======================
    # A. KPI CARDS
    # ======================
    # Active engagements: CONFIRMED or COMPLETED orders
    active_engagements = db.query(Order).filter(
        Order.status.in_([OrderStatus.CONFIRMED, OrderStatus.COMPLETED])
    ).count()
    
    # Total contract value: Sum of all orders (no canceled status exists)
    total_contract_value = db.query(func.sum(Order.total_amount)).scalar()
    
    # Inactive engagements: DRAFT orders
    inactive_engagements = db.query(Order).filter(
        Order.status == OrderStatus.DRAFT
    ).count()
    
    kpi_cards = {
        "active_engagements": int(active_engagements or 0),
        "total_contract_value": _to_float(total_contract_value),
        "inactive_engagements": int(inactive_engagements or 0),
    }
    
    # ======================
    # B. INDUSTRY METRICS
    # ======================
    # Revenue by industry: Sum of order totals grouped by customer industry
    revenue_by_industry_rows = (
        db.query(
            Customer.industry.label("name"),
            func.coalesce(func.sum(Order.total_amount), 0).label("value"),
        )
        .join(Order, Order.customer_id == Customer.id)
        .group_by(Customer.industry)
        .all()
    )
    revenue_by_industry = [
        {"name": row.name, "value": _to_float(row.value)} 
        for row in revenue_by_industry_rows
    ]
    
    # Share by industry: Count of orders grouped by customer industry
    share_by_industry_rows = (
        db.query(
            Customer.industry.label("name"),
            func.count(Order.id).label("value"),
        )
        .join(Order, Order.customer_id == Customer.id)
        .group_by(Customer.industry)
        .all()
    )
    share_by_industry = [
        {"name": row.name, "value": int(row.value)} 
        for row in share_by_industry_rows
    ]
    
    # ======================
    # C. SERVICE LINE METRICS
    # ======================
    # Revenue by service line: Sum of unit_price from order items
    revenue_by_service_line_rows = (
        db.query(
            Product.service_line.label("name"),
            func.coalesce(func.sum(OrderItem.unit_price), 0).label("value"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.service_line)
        .all()
    )
    revenue_by_service_line = [
        {"name": row.name, "value": _to_float(row.value)} 
        for row in revenue_by_service_line_rows
    ]
    
    # Share by service line: Count of order items grouped by service line
    share_by_service_line_rows = (
        db.query(
            Product.service_line.label("name"),
            func.count(OrderItem.id).label("value"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.service_line)
        .all()
    )
    share_by_service_line = [
        {"name": row.name, "value": int(row.value)} 
        for row in share_by_service_line_rows
    ]
    
    # ======================
    # D. ANNUAL TRENDS (Current Year - Always 12 Months)
    # ======================
    current_year = datetime.utcnow().year
    
    # Get all service lines that exist in the database
    all_service_lines = set(
        sl for (sl,) in db.query(Product.service_line).distinct().all()
    )
    
    # Query order items for current year, grouped by month and service line
    annual_data = (
        db.query(
            extract("month", OrderItem.created_at).label("month"),
            Product.service_line.label("service_line"),
            func.coalesce(func.sum(OrderItem.unit_price), 0).label("value"),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .filter(extract("year", OrderItem.created_at) == current_year)
        .group_by(
            extract("month", OrderItem.created_at),
            Product.service_line,
        )
        .all()
    )
    
    # Initialize structure for all 12 months with zeros
    monthly_trends = []
    for month_num in range(1, 13):
        month_entry = {"month": calendar.month_abbr[month_num]}
        
        # Initialize all service lines with 0
        for service_line in all_service_lines:
            month_entry[service_line] = 0.0
        
        monthly_trends.append(month_entry)
    
    # Fill in actual data from query
    for row in annual_data:
        month_idx = int(row.month) - 1  # Convert to 0-based index
        service_line = row.service_line
        value = _to_float(row.value)
        
        if 0 <= month_idx < 12:
            monthly_trends[month_idx][service_line] = value
    
    # ======================
    # RESPONSE ASSEMBLY
    # ======================
    return {
        "kpi_cards": kpi_cards,
        "revenue_by_industry": revenue_by_industry,
        "share_by_industry": share_by_industry,
        "revenue_by_service_line": revenue_by_service_line,
        "share_by_service_line": share_by_service_line,
        "annual_trends": monthly_trends,
    }
