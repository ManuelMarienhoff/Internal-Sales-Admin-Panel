from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import List, Optional, Generic, TypeVar
from decimal import Decimal


# Generic type for paginated responses
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper"""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
    model_config = ConfigDict(arbitrary_types_allowed=True)


# ============== CUSTOMER SCHEMAS ==============
class CustomerCreate(BaseModel):
    """Schema for creating a customer"""
    company_name: str = Field(..., min_length=1, max_length=150)
    industry: str = Field(..., min_length=1, max_length=100)
    # Validation: Name must not be empty (min 1) and not too long (max 100)
    name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    # Validation: Checks for valid email format (user@example.com)
    email: EmailStr


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=150)
    industry: Optional[str] = Field(None, min_length=1, max_length=100)
    # Validation: Optional fields. If provided, must enforce length limits
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class CustomerResponse(BaseModel):
    """Customer response schema"""
    id: int
    company_name: str
    industry: str
    name: str
    last_name: str
    email: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CustomerBase(BaseModel):
    """Minimal customer info for nested responses"""
    company_name: str
    industry: str
    name: str
    last_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class CustomerWithOrders(CustomerResponse):
    """Customer schema with associated orders"""
    orders: List["OrderResponse"] = []


# ============== PRODUCT SCHEMAS ==============
class ProductCreate(BaseModel):
    """Schema for creating a product"""
    name: str = Field(..., min_length=1, max_length=150)
    service_line: str = Field(..., min_length=1, max_length=100)
    # Validation: Optional description, max 500 chars
    description: Optional[str] = Field(None, max_length=500)
    # Validation: Positive number (gt=0) with max 2 decimal places (currency)
    price: Decimal = Field(..., decimal_places=2, gt=0)
    is_active: bool = True  # Default is True


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    service_line: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: Optional[Decimal] = Field(None, decimal_places=2, gt=0)
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """Product response schema"""
    id: int
    name: str
    service_line: str
    description: Optional[str]
    price: Decimal
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============== ORDER ITEM SCHEMAS ==============
class OrderItemCreate(BaseModel):
    """Schema for creating an order item"""
    # Validation: ID must be a positive integer
    product_id: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    """Order item response schema"""
    id: int
    order_id: int
    product_id: int
    unit_price: Decimal
    created_at: datetime
    product: ProductResponse  
    
    model_config = ConfigDict(from_attributes=True)


# ============== ORDER SCHEMAS ==============
class OrderCreate(BaseModel):
    """Schema for creating an order"""
    customer_id: int = Field(..., gt=0)
    # Validation: List must contain at least 1 item (cannot create empty order)
    items: List[OrderItemCreate] = Field(..., min_length=1)


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
    customer: CustomerBase  # Nested customer info
    status: str
    total_amount: Decimal
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class OrderWithDetails(OrderResponse):
    """Order schema with complete details (items and customer)"""
    customer: CustomerResponse
    items: List[OrderItemResponse]
