from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
from database import get_db
from models import Order, OrderItem, Customer, Product, OrderStatus
from schemas import OrderCreate, OrderUpdate, OrderResponse, OrderWithDetails

router = APIRouter(
    prefix="/api/orders",
    tags=["orders"],
    responses={404: {"description": "Order not found"}},
)


# ==========================================
# CREATE ORDER (Transaction & Business Logic)
# ==========================================
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """
    Create a new order with items.
    - Validates customer exists
    - Fetches current product prices and freezes them
    - Calculates total amount automatically
    - Rolls back transaction if any product is invalid or inactive
    """
    # 1. Verify customer exists
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order.customer_id} not found"
        )
    
    # 2. Validate and fetch products with their current prices
    order_items_data = []
    total_amount = Decimal("0.00")
    
    try:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            
            # Check if product exists
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} not found"
                )
            
            # Check if product is active (CRITICAL RULE)
            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is inactive and cannot be ordered"
                )
            
            # Calculate item subtotal with frozen price (FROM DB, NOT FRONTEND)
            item_subtotal = product.price * item.quantity
            total_amount += item_subtotal
            
            # Store product data for later use
            order_items_data.append({
                "product": product,
                "quantity": item.quantity,
                "unit_price": product.price
            })
        
        # 3. Create the order header
        db_order = Order(
            customer_id=order.customer_id,
            status=OrderStatus.DRAFT,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush()  # Flush to get the order ID without committing yet
        
        # 4. Create order items with frozen prices
        for item_data in order_items_data:
            db_order_item = OrderItem(
                order_id=db_order.id,
                product_id=item_data["product"].id,
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"]
            )
            db.add(db_order_item)
        
        # 5. Commit everything if success
        db.commit()
        db.refresh(db_order)
        return db_order
    
    except HTTPException:
        # If logical error (e.g. inactive product), rollback and propagate error
        db.rollback()
        raise
    except Exception as e:
        # If database error, rollback and return 500
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating order: {str(e)}"
        )


# ==========================================
# LIST ORDERS
# ==========================================
@router.get("/", response_model=list[OrderResponse])
def get_orders(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Get list of orders with pagination"""
    orders = db.query(Order).offset(skip).limit(limit).all()
    return orders


# ==========================================
# GET ORDER DETAIL (With Items & Customer)
# ==========================================
@router.get("/{order_id}", response_model=OrderWithDetails)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """
    Get a specific order by ID with complete details.
    Includes customer information and all ordered products.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return order


# ==========================================
# UPDATE STATUS 
# ==========================================
@router.patch("/{order_id}", response_model=OrderResponse)
def update_order_status(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
    """
    Update order status with business logic validation.
    - Only draft orders can be edited/confirmed
    """
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Business rule: Only draft orders can be edited
    if db_order.status != OrderStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit order with status '{db_order.status.value}'. Only draft orders can be modified."
        )
    
    # Validate and update status if provided
    if order_update.status:
        new_status = OrderStatus(order_update.status)
        db_order.status = new_status
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order
