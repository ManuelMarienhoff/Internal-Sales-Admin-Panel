from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

Base = declarative_base()


class Customer(Base):
    """Modelo de Cliente"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relación con órdenes
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Customer(id={self.id}, nombre={self.nombre}, email={self.email})>"


class Product(Base):
    """Modelo de Producto"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False, index=True)
    descripcion = Column(String(500))
    # Usar Numeric para precisión decimal (evitar errores de redondeo con float)
    precio = Column(Numeric(10, 2), nullable=False)
    estado = Column(Boolean, default=True, nullable=False)  # True = activo, False = inactivo
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relación con items de orden
    order_items = relationship("OrderItem", back_populates="product", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Product(id={self.id}, nombre={self.nombre}, precio={self.precio})>"


class OrderStatus(str, enum.Enum):
    """Estados permitidos para órdenes"""
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"


class Order(Base):
    """Modelo de Orden"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    estado = Column(Enum(OrderStatus), default=OrderStatus.DRAFT, nullable=False)
    monto_total = Column(Numeric(12, 2), default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, customer_id={self.customer_id}, estado={self.estado})>"


class OrderItem(Base):
    """Modelo de Item de Orden (tabla intermedia)"""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    cantidad = Column(Integer, nullable=False)
    # precio_congelado: precio al momento de la compra para mantener historial
    precio_congelado = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id})>"
