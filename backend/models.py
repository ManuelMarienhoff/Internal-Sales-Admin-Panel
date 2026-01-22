from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class Customer(Base):
    """Customer model"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship with orders
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Customer(id={self.id}, name={self.name}, email={self.email})>"


class Product(Base):
    """Product model"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    description = Column(String(500))
    # Use Numeric for decimal precision (avoid rounding errors with float)
    price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)  # True = active, False = inactive
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship with order items
    order_items = relationship("OrderItem", back_populates="product", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price={self.price})>"


class OrderStatus(str, enum.Enum):
    """Allowed statuses for orders"""
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"


class Order(Base):
    """Order model"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.DRAFT, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, customer_id={self.customer_id}, status={self.status})>"


class OrderItem(Base):
    """Order item model (junction table)"""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    # unit_price: product price at the time of purchase to maintain history
    unit_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id})>"
