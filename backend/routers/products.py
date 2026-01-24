from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Product
from schemas import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(
    prefix="/api/products",
    tags=["products"],
    responses={404: {"description": "Product not found"}},
)


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
@router.get("/", response_model=list[ProductResponse])
def get_products(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Get list of products with pagination"""
    products = db.query(Product).offset(skip).limit(limit).all()
    return products


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
# UPDATE PRODUCT
# ==========================================
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    """Update an existing product"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Update only provided fields
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# ==========================================
# DELETE PRODUCT (Soft Delete)
# ==========================================
@router.delete("/{product_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Deactivate a product (change status to inactive).
    Does not delete the record, only changes its status.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Change status to inactive instead of deleting
    db_product.is_active = False
    db.add(db_product)
    db.commit()
    
    return {
        "message": f"Product {db_product.name} deactivated successfully",
        "id": db_product.id,
        "status": "inactive"
    }
