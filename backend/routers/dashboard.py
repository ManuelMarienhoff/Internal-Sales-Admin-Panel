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
def get_dashboard_stats(
    month: int | None = None,
    year: int = datetime.utcnow().year,
    db: Session = Depends(get_db)
):
    """
    Returns comprehensive analytics for the B2B dashboard with optional temporal filtering.
    
    Query Parameters:
    - month (optional): Filter metrics by month (1-12). If omitted, uses full year.
    - year (default: current year): Year to analyze.
    
    Hybrid Filtering Logic:
    - KPI Cards, Industry Metrics, Service Line Metrics: Affected by month filter.
    - Annual Trends: Always returns 12 months for the selected year (ignores month filter).
    
    Includes:
    - KPI Cards (active/inactive engagements, total contract value)
    - Industry Metrics (revenue and share by industry)
    - Service Line Metrics (revenue and share by service line)
    - Annual Trends (12 months for selected year, grouped by service line)
    """
    
    # ======================
    # A. KPI CARDS (FILTERED)
    # ======================
    # Build base query with year filter
    kpi_query = db.query(Order).filter(extract("year", Order.created_at) == year)
    
    # Apply month filter if provided
    if month is not None:
        kpi_query = kpi_query.filter(extract("month", Order.created_at) == month)
    
    # Active engagements: CONFIRMED or COMPLETED orders
    active_engagements = kpi_query.filter(
        Order.status.in_([OrderStatus.CONFIRMED, OrderStatus.COMPLETED])
    ).count()
    
    # Total contract value: Sum of all orders
    total_contract_value = kpi_query.with_entities(
        func.sum(Order.total_amount)
    ).scalar()
    
    # Inactive engagements: DRAFT orders
    inactive_engagements = kpi_query.filter(
        Order.status == OrderStatus.DRAFT
    ).count()
    
    kpi_cards = {
        "active_engagements": int(active_engagements or 0),
        "total_contract_value": _to_float(total_contract_value),
        "inactive_engagements": int(inactive_engagements or 0),
    }
    
    # ======================
    # B. INDUSTRY METRICS (FILTERED)
    # ======================
    # Revenue by industry: Sum of order totals grouped by customer industry
    revenue_by_industry_query = (
        db.query(
            Customer.industry.label("name"),
            func.coalesce(func.sum(Order.total_amount), 0).label("value"),
        )
        .join(Order, Order.customer_id == Customer.id)
        .filter(extract("year", Order.created_at) == year)
    )
    if month is not None:
        revenue_by_industry_query = revenue_by_industry_query.filter(
            extract("month", Order.created_at) == month
        )
    
    revenue_by_industry_rows = revenue_by_industry_query.group_by(Customer.industry).all()
    revenue_by_industry = [
        {"name": row.name, "value": _to_float(row.value)} 
        for row in revenue_by_industry_rows
    ]
    
    # Share by industry: Count of orders grouped by customer industry
    share_by_industry_query = (
        db.query(
            Customer.industry.label("name"),
            func.count(Order.id).label("value"),
        )
        .join(Order, Order.customer_id == Customer.id)
        .filter(extract("year", Order.created_at) == year)
    )
    if month is not None:
        share_by_industry_query = share_by_industry_query.filter(
            extract("month", Order.created_at) == month
        )
    
    share_by_industry_rows = share_by_industry_query.group_by(Customer.industry).all()
    share_by_industry = [
        {"name": row.name, "value": int(row.value)} 
        for row in share_by_industry_rows
    ]
    
    # ======================
    # C. SERVICE LINE METRICS (FILTERED)
    # ======================
    # Revenue by service line: Sum of unit_price from order items
    revenue_by_service_line_query = (
        db.query(
            Product.service_line.label("name"),
            func.coalesce(func.sum(OrderItem.unit_price), 0).label("value"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .filter(extract("year", OrderItem.created_at) == year)
    )
    if month is not None:
        revenue_by_service_line_query = revenue_by_service_line_query.filter(
            extract("month", OrderItem.created_at) == month
        )
    
    revenue_by_service_line_rows = revenue_by_service_line_query.group_by(Product.service_line).all()
    revenue_by_service_line = [
        {"name": row.name, "value": _to_float(row.value)} 
        for row in revenue_by_service_line_rows
    ]
    
    # Share by service line: Count of order items grouped by service line
    share_by_service_line_query = (
        db.query(
            Product.service_line.label("name"),
            func.count(OrderItem.id).label("value"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .filter(extract("year", OrderItem.created_at) == year)
    )
    if month is not None:
        share_by_service_line_query = share_by_service_line_query.filter(
            extract("month", OrderItem.created_at) == month
        )
    
    share_by_service_line_rows = share_by_service_line_query.group_by(Product.service_line).all()
    share_by_service_line = [
        {"name": row.name, "value": int(row.value)} 
        for row in share_by_service_line_rows
    ]
    
    # ======================
    # D. ANNUAL TRENDS (Always 12 Months - NOT FILTERED BY MONTH)
    # ======================
    # Note: Annual trends ALWAYS show full year, ignoring month parameter
    
    # Get all service lines that exist in the database
    all_service_lines = set(
        sl for (sl,) in db.query(Product.service_line).distinct().all()
    )
    
    # Query order items for selected year, grouped by month and service line
    # IMPORTANT: Only filter by year, NOT by month (always show Jan-Dec)
    annual_data = (
        db.query(
            extract("month", OrderItem.created_at).label("month"),
            Product.service_line.label("service_line"),
            func.coalesce(func.sum(OrderItem.unit_price), 0).label("value"),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .filter(extract("year", OrderItem.created_at) == year)
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
