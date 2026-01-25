from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Product, Order, OrderItem, OrderStatus
from schemas import ProductCreate, ProductUpdate, ProductResponse, PaginatedResponse
from decimal import Decimal

router = APIRouter(
    prefix="/api/products",
    tags=["products"],
    responses={404: {"description": "Product not found"}},
)


# ==========================================
# HELPER: Remove Product from Draft Orders
# ==========================================
def _remove_product_from_drafts(db: Session, product_id: int) -> list[int]:
    """
    Remove a product from all draft orders and recalculate their totals.
    
    Args:
        db: Database session
        product_id: ID of the product to remove from drafts
    
    Returns:
        List of affected draft order IDs
    """
    # Find all draft orders containing this product
    draft_orders = db.query(Order).filter(
        Order.status == OrderStatus.DRAFT,
        Order.items.any(OrderItem.product_id == product_id)
    ).all()
    
    affected_orders = []
    
    for draft_order in draft_orders:
        # Find and delete order items for this product
        order_items = db.query(OrderItem).filter(
            OrderItem.order_id == draft_order.id,
            OrderItem.product_id == product_id
        ).all()
        
        for item in order_items:
            db.delete(item)
        
        # Force flush so the remaining_items query sees the deletions immediately
        db.flush()
        
        # Recalculate and update the order's total_amount
        remaining_items = db.query(OrderItem).filter(
            OrderItem.order_id == draft_order.id
        ).all()
        
        if len(remaining_items) == 0:
            # If the order is now empty, delete the order itself
            db.delete(draft_order)
        else:
            # Otherwise, recalculate the total and persist the order
            new_total = sum(
                Decimal(item.quantity) * Decimal(item.unit_price)
                for item in remaining_items
            )
            draft_order.total_amount = new_total
            db.add(draft_order)
        affected_orders.append(draft_order.id)
    
    db.flush()  # Flush to ensure draft cleanup is registered
    
    return affected_orders


# ==========================================
# CREATE PRODUCT (Uniqueness Check)
# ==========================================
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    # Check if product already exists by name
    existing_product = db.query(Product).filter(Product.name == product.name).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A product with name '{product.name}' already exists"
        )
    
    db_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        is_active=product.is_active
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# ==========================================
# LIST PRODUCTS 
# ==========================================
@router.get("/", response_model=PaginatedResponse[ProductResponse])
def get_products(skip: int = 0, limit: int = 10, search: str = None, is_active: bool = None, db: Session = Depends(get_db)):
    """Get list of products with pagination, search, optional active filter, and total count"""
    query = db.query(Product)

    if search:
        if search.isdigit():
            query = query.filter(Product.id == int(search))
        else:
            query = query.filter(Product.name.ilike(f"%{search}%"))

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    page = (skip // limit) + 1 if limit else 1
    pages = (total + limit - 1) // limit if limit else 1

    return PaginatedResponse[ProductResponse](
        items=items,
        total=total,
        page=page,
        size=limit,
        pages=pages
    )


# ==========================================
# GEdT PRODUCT DETAIL
# ==========================================
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    return product


# ==========================================
# UPDATE PRODUCT (with Draft Cleanup on Deactivation)
# ==========================================
@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    """
    Update an existing product.
    
    Special Logic: If deactivating a product (is_active=False), automatically
    remove it from all draft orders to maintain data integrity.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Check if we're deactivating the product (is_active: True -> False)
    update_data = product_update.dict(exclude_unset=True)
    is_deactivating = (
        'is_active' in update_data 
        and update_data['is_active'] is False 
        and db_product.is_active is True
    )
    
    # If deactivating, remove from draft orders first
    if is_deactivating:
        _remove_product_from_drafts(db, product_id)
    
    # Update only provided fields
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# ==========================================
# DELETE PRODUCT (Hybrid Intelligent Deletion)
# ==========================================
@router.delete("/{product_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Hybrid intelligent deletion logic:
    
    1. DRAFT CLEANUP: Removes product from all draft orders and recalculates totals.
    2. INTEGRITY CHECK: Verifies if product exists in confirmed/completed orders.
    3. DELETION DECISION:
       - If in confirmed/completed orders: Deactivate (soft delete)
       - If not in historical orders: Permanent deletion (hard delete)
    """
    try:
        # Step 0: Verify product exists
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
        
        # ========== STEP 1: DRAFT CLEANUP ==========
        affected_orders = _remove_product_from_drafts(db, product_id)
        
        # ========== STEP 2: INTEGRITY CHECK ==========
        # Check if product still appears in confirmed/completed orders
        historical_orders = db.query(OrderItem).filter(
            OrderItem.product_id == product_id,
            OrderItem.order.has(
                Order.status.in_([OrderStatus.CONFIRMED, OrderStatus.COMPLETED])
            )
        ).first()
        
        # ========== STEP 3: DELETION DECISION ==========
        if historical_orders:
            # CASE A: Product has historical data → SOFT DELETE (Deactivate)
            db_product.is_active = False
            db.add(db_product)
            db.commit()
            
            return {
                "message": "The product appears in historical orders, so it was deactivated but not deleted.",
                "product_id": product_id,
                "action": "deactivated",
                "affected_draft_orders": affected_orders
            }
        else:
            # CASE B: No historical data → HARD DELETE (Permanent Removal)
            product_id_to_delete = db_product.id
            db.delete(db_product)
            db.commit()
            
            return {
                "message": "Product permanently removed",
                "product_id": product_id_to_delete,
                "action": "deleted",
                "affected_draft_orders": affected_orders
            }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Rollback on any unexpected error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting product: {str(e)}"
        )
