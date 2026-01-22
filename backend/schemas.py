from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional
from decimal import Decimal


# ============== CUSTOMER SCHEMAS ==============
class CustomerCreate(BaseModel):
    """Schema para crear un cliente"""
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    email: EmailStr


class CustomerUpdate(BaseModel):
    """Schema para actualizar un cliente"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class CustomerResponse(BaseModel):
    """Schema de respuesta de cliente"""
    id: int
    nombre: str
    apellido: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class CustomerWithOrders(CustomerResponse):
    """Schema de cliente con sus órdenes"""
    orders: List["OrderResponse"] = []


# ============== PRODUCT SCHEMAS ==============
class ProductCreate(BaseModel):
    """Schema para crear un producto"""
    nombre: str = Field(..., min_length=1, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=500)
    precio: Decimal = Field(..., decimal_places=2, gt=0)
    estado: bool = True  # True = activo, False = inactivo


class ProductUpdate(BaseModel):
    """Schema para actualizar un producto"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=500)
    precio: Optional[Decimal] = Field(None, decimal_places=2, gt=0)
    estado: Optional[bool] = None


class ProductResponse(BaseModel):
    """Schema de respuesta de producto"""
    id: int
    nombre: str
    descripcion: Optional[str]
    precio: Decimal
    estado: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== ORDER ITEM SCHEMAS ==============
class OrderItemCreate(BaseModel):
    """Schema para crear un item de orden"""
    product_id: int = Field(..., gt=0)
    cantidad: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    """Schema de respuesta de item de orden"""
    id: int
    order_id: int
    product_id: int
    cantidad: int
    precio_congelado: Decimal
    created_at: datetime
    product: ProductResponse  # Incluir detalles del producto
    
    class Config:
        from_attributes = True


# ============== ORDER SCHEMAS ==============
class OrderCreate(BaseModel):
    """Schema para crear una orden"""
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_items=1)


class OrderUpdate(BaseModel):
    """Schema para actualizar una orden"""
    estado: Optional[str] = Field(None, pattern="^(draft|confirmed|completed)$")


class OrderResponse(BaseModel):
    """Schema de respuesta de orden"""
    id: int
    customer_id: int
    estado: str
    monto_total: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderWithDetails(OrderResponse):
    """Schema de orden con detalles completos (items y cliente)"""
    customer: CustomerResponse
    items: List[OrderItemResponse]
