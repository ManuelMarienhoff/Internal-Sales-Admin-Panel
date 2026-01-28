from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
from database import get_db
from models import Order, OrderItem, Customer, Product, OrderStatus
from schemas import OrderCreate, OrderUpdate, OrderResponse, OrderWithDetails, PaginatedResponse

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
    Create a new order with items and apply business logic validation.
    
    Business Logic:
    1. Validates that the Customer exists and is retrievable from the database.
    2. Validates that each Service (Product) exists and is active.
    3. Implements Price Snapshot pattern: Freezes the current price of each service
       at the time of purchase. This ensures that future catalog price changes do not
       retroactively affect past orders, maintaining historical accuracy and revenue integrity.
    4. Calculates total_amount automatically by summing frozen prices.
    5. Rolls back entire transaction if any product is missing or inactive, ensuring data consistency.
    
    Args:
        order: Order creation request with customer_id and list of items (product_id)
        db: Database session
    
    Returns:
        OrderResponse: Created order with DRAFT status and calculated total_amount
    
    Raises:
        HTTPException: 404 if customer/product not found, 400 if product inactive
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
            item_subtotal = product.price
            total_amount += item_subtotal
            
            # Store product data for later use
            order_items_data.append({
                "product": product,
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
@router.get("/", response_model=PaginatedResponse[OrderResponse])
def get_orders(skip: int = 0, limit: int = 10, search: str = None, status: str = None, db: Session = Depends(get_db)):
    """Get list of orders with pagination, search, status filter, and total count"""
    query = db.query(Order).options(joinedload(Order.customer))

    if search:
        if search.isdigit():
            query = query.filter(Order.id == int(search))
        else:
            search_filter = f"%{search}%"
            query = query.join(Customer).filter(
                (Customer.company_name.ilike(search_filter)) |
                (Customer.name.ilike(search_filter)) |
                (Customer.last_name.ilike(search_filter))
            )

    if status:
        query = query.filter(Order.status == status)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    page = (skip // limit) + 1 if limit else 1
    pages = (total + limit - 1) // limit if limit else 1

    return PaginatedResponse[OrderResponse](
        items=items,
        total=total,
        page=page,
        size=limit,
        pages=pages
    )


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
    Update order status or items with state machine validation and revenue protection.
    
    Business Logic:
    1. Items Editing: Only Draft orders can have items modified. Confirmed/Completed orders
       are immutable to maintain audit trails and prevent accidental data loss.
    2. Status Transitions: Enforces strict state machine (Draft => Confirmed => Completed).
       Prevents invalid transitions (e.g., reverting Completed orders to Draft) to protect
       revenue recognition and financial reporting accuracy.
    3. Product Validation: Before transitioning to Confirmed status, verifies that all
       products in the order are still active. Inactive products must be removed before confirmation.
    
    Args:
        order_id: ID of the order to update
        order_update: Update payload with optional items list and/or status field
        db: Database session
    
    Returns:
        OrderResponse: Updated order with new status and recalculated totals
    
    Raises:
        HTTPException: 400 if invalid state transition or validation failure
    """
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # If updating items, only draft orders can be modified
    if order_update.items:
        if db_order.status != OrderStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot edit items of order with status '{db_order.status.value}'. Only draft orders can have items modified."
            )
        
        # Delete existing items and create new ones
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        
        total_amount = Decimal("0.00")
        
        for item in order_update.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} not found"
                )
            
            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is inactive and cannot be ordered"
                )
            
            item_subtotal = product.price
            total_amount += item_subtotal
            
            db_order_item = OrderItem(
                order_id=order_id,
                product_id=item.product_id,
                unit_price=product.price
            )
            db.add(db_order_item)
        
        db_order.total_amount = total_amount
    
    # Validate and update status if provided
    if order_update.status:
        new_status = OrderStatus(order_update.status)
        current_status = db_order.status
        
        # State Machine: Validate allowed transitions
        # draft -> confirmed -> completed
        valid_transitions = {
            OrderStatus.DRAFT: [OrderStatus.CONFIRMED],
            OrderStatus.CONFIRMED: [OrderStatus.COMPLETED],
            OrderStatus.COMPLETED: []
        }
        
        if new_status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status transition. Allowed: draft -> confirmed -> completed"
            )
        
        # Business rule: Cannot transition to confirmed if order has inactive products
        if current_status == OrderStatus.DRAFT and new_status == OrderStatus.CONFIRMED:
            # Check if all products in order items are active
            inactive_products = db.query(Product).join(
                OrderItem, OrderItem.product_id == Product.id
            ).filter(
                OrderItem.order_id == order_id,
                Product.is_active == False
            ).all()
            
            if inactive_products:
                inactive_names = ', '.join([p.name for p in inactive_products])
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot confirm order with inactive products: {inactive_names}. Please remove these items before confirming."
                )
        
        db_order.status = new_status
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


# ==========================================
# DELETE ORDER
# ==========================================
@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Delete an order.
    - Only draft orders can be deleted
    """
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Business rule: Only draft orders can be deleted
    if db_order.status != OrderStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete order with status '{db_order.status.value}'. Only draft orders can be deleted."
        )
    
    # Delete associated items first
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
    
    # Delete the order
    db.delete(db_order)
    db.commit()
    
    return None
