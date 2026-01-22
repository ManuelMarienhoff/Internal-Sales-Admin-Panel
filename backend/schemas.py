from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional
from decimal import Decimal


# ============== CUSTOMER SCHEMAS ==============
class CustomerCreate(BaseModel):
    """Schema for creating a customer"""
    name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
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
        from_attributes = True


class CustomerWithOrders(CustomerResponse):
    """Customer schema with associated orders"""
    orders: List["OrderResponse"] = []


# ============== PRODUCT SCHEMAS ==============
class ProductCreate(BaseModel):
    """Schema for creating a product"""
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    price: Decimal = Field(..., decimal_places=2, gt=0)
    is_active: bool = True  # True = active, False = inactive


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
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    """Order item response schema"""
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    created_at: datetime
    product: ProductResponse  # Include product details
    
    class Config:
        from_attributes = True


# ============== ORDER SCHEMAS ==============
class OrderCreate(BaseModel):
    """Schema for creating an order"""
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_items=1)


class OrderUpdate(BaseModel):
    """Schema for updating an order"""
    status: Optional[str] = Field(None, pattern="^(draft|confirmed|completed)$")


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
