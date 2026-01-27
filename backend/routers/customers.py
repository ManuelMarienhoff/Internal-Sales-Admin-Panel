from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import Customer
from schemas import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerWithOrders, PaginatedResponse

router = APIRouter(
    prefix="/api/customers",
    tags=["customers"],
    responses={404: {"description": "Customer not found"}},
)


# ==========================================
# CREATE CUSTOMER (Uniqueness Validation)
# ==========================================
@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    # --- DEBUG PRINT ---
    print(f"👀 RECIBIDO EN BACKEND: {customer.model_dump()}")
    """Create a new customer"""
    # Check if email already exists
    existing_customer = db.query(Customer).filter(Customer.email == customer.email).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A customer with email '{customer.email}' already exists"
        )
    
    db_customer = Customer(
        company_name=customer.company_name,
        industry=customer.industry,
        name=customer.name,
        last_name=customer.last_name,
        email=customer.email
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


# ==========================================
# LIST CUSTOMERS 
# ==========================================
@router.get("/", response_model=PaginatedResponse[CustomerResponse])
def get_customers(skip: int = 0, limit: int = 10, search: str = None, industry: str = None, db: Session = Depends(get_db)):
    """Get list of customers with pagination, search, industry filter, and total count"""
    query = db.query(Customer)

    if search:
        if search.isdigit():
            query = query.filter(Customer.id == int(search))
        else:
            search_filter = f"%{search}%"
            query = query.filter(
                (Customer.company_name.ilike(search_filter)) |
                (Customer.industry.ilike(search_filter)) |
                (Customer.name.ilike(search_filter)) |
                (Customer.last_name.ilike(search_filter)) |
                (Customer.email.ilike(search_filter))
            )

    if industry:
        query = query.filter(Customer.industry == industry)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    page = (skip // limit) + 1 if limit else 1
    pages = (total + limit - 1) // limit if limit else 1

    return PaginatedResponse[CustomerResponse](
        items=items,
        total=total,
        page=page,
        size=limit,
        pages=pages
    )


# ==========================================
# GET CUSTOMER DETAIL (With Orders)
# ==========================================
@router.get("/{customer_id}", response_model=CustomerWithOrders)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a specific customer by ID with their orders"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer


# ==========================================
# UPDATE CUSTOMER
# ==========================================
@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    """Update an existing customer"""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    
    # Check if email already exists (if trying to change it)
    if customer_update.email and customer_update.email != db_customer.email:
        existing_customer = db.query(Customer).filter(Customer.email == customer_update.email).first()
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A customer with email '{customer_update.email}' already exists"
            )
    
    # Update only provided fields
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


# ==========================================
# DELETE CUSTOMER (Integrity Check)
# ==========================================
@router.delete("/{customer_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Delete a customer from the database.
    Note: It is not possible to delete a customer that has associated orders.
    """
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    
    # Check if customer has associated orders
    if db_customer.orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete customer '{db_customer.name} {db_customer.last_name}' "
                   f"because they have {len(db_customer.orders)} associated order(s). "
                   f"You must delete or reassign their orders first."
        )
    
    try:
        db.delete(db_customer)
        db.commit()
        return {
            "message": f"Customer {db_customer.name} {db_customer.last_name} deleted successfully",
            "id": db_customer.id
        }
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete customer due to database integrity constraints"
        )