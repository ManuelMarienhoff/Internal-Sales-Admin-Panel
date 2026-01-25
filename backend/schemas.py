from pydantic import BaseModel, EmailStr, Field
from pydantic.generics import GenericModel
from datetime import datetime
from typing import List, Optional, Generic, TypeVar
from decimal import Decimal


# Generic type for paginated responses
T = TypeVar("T")


class PaginatedResponse(GenericModel, Generic[T]):
    """Generic paginated response wrapper"""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


# ============== CUSTOMER SCHEMAS ==============
class CustomerCreate(BaseModel):
    """Schema for creating a customer"""
    # Validation: Name must not be empty (min 1) and not too long (max 100)
    name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    # Validation: Checks for valid email format (user@example.com)
    email: EmailStr


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    # Validation: Optional fields. If provided, must enforce length limits
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class CustomerResponse(BaseModel):
    """Customer response schema"""
    id: int
    name: str
    last_name: str
    email: str
    created_at: datetime
    
    class Config:
        # Config: Allows Pydantic to read data from ORM (SQLAlchemy) objects
        from_attributes = True


class CustomerWithOrders(CustomerResponse):
    """Customer schema with associated orders"""
    orders: List["OrderResponse"] = []


# ============== PRODUCT SCHEMAS ==============
class ProductCreate(BaseModel):
    """Schema for creating a product"""
    name: str = Field(..., min_length=1, max_length=150)
    # Validation: Optional description, max 500 chars
    description: Optional[str] = Field(None, max_length=500)
    # Validation: Positive number (gt=0) with max 2 decimal places (currency)
    price: Decimal = Field(..., decimal_places=2, gt=0)
    is_active: bool = True  # Default is True


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    price: Optional[Decimal] = Field(None, decimal_places=2, gt=0)
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """Product response schema"""
    id: int
    name: str
    description: Optional[str]
    price: Decimal
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== ORDER ITEM SCHEMAS ==============
class OrderItemCreate(BaseModel):
    """Schema for creating an order item"""
    # Validation: ID must be a positive integer
    product_id: int = Field(..., gt=0)
    # Validation: Quantity must be at least 1 (cannot buy 0 items)
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    """Order item response schema"""
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    created_at: datetime
    product: ProductResponse  
    
    class Config:
        from_attributes = True


# ============== ORDER SCHEMAS ==============
class OrderCreate(BaseModel):
    """Schema for creating an order"""
    customer_id: int = Field(..., gt=0)
    # Validation: List must contain at least 1 item (cannot create empty order)
    items: List[OrderItemCreate] = Field(..., min_items=1)


class OrderUpdate(BaseModel):
    """Schema for updating an order"""
    # Validation: Only allows specifically defined status strings
    status: Optional[str] = Field(None, pattern="^(draft|confirmed|completed)$")
    # Validation: Optional list of items for updating order items (only for draft orders)
    items: Optional[List[OrderItemCreate]] = None


class OrderResponse(BaseModel):
    """Order response schema"""
    id: int
    customer_id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderWithDetails(OrderResponse):
    """Order schema with complete details (items and customer)"""
    customer: CustomerResponse
    items: List[OrderItemResponse]
