from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import Customer
from schemas import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerWithOrders

router = APIRouter(
    prefix="/api/customers",
    tags=["customers"],
    responses={404: {"description": "Cliente no encontrado"}},
)


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Crear un nuevo cliente"""
    # Verificar si el email ya existe
    existing_customer = db.query(Customer).filter(Customer.email == customer.email).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un cliente con el email '{customer.email}'"
        )
    
    db_customer = Customer(
        nombre=customer.nombre,
        apellido=customer.apellido,
        email=customer.email
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("/", response_model=list[CustomerResponse])
def get_customers(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Obtener lista de clientes con paginación"""
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerWithOrders)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Obtener un cliente específico por ID con sus órdenes"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {customer_id} no encontrado"
        )
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    """Actualizar un cliente existente"""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {customer_id} no encontrado"
        )
    
    # Verificar si el email ya existe (si se intenta cambiar)
    if customer_update.email and customer_update.email != db_customer.email:
        existing_customer = db.query(Customer).filter(Customer.email == customer_update.email).first()
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un cliente con el email '{customer_update.email}'"
            )
    
    # Actualizar solo los campos que fueron proporcionados
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.delete("/{customer_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Eliminar un cliente de la base de datos.
    Nota: No es posible eliminar un cliente que tiene órdenes asociadas.
    """
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {customer_id} no encontrado"
        )
    
    # Verificar si el cliente tiene órdenes asociadas
    if db_customer.orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No se puede eliminar el cliente '{db_customer.nombre} {db_customer.apellido}' "
                   f"porque tiene {len(db_customer.orders)} orden(es) asociada(s). "
                   f"Debe eliminar o reasignar sus órdenes primero."
        )
    
    try:
        db.delete(db_customer)
        db.commit()
        return {
            "message": f"Cliente {db_customer.nombre} {db_customer.apellido} eliminado exitosamente",
            "id": db_customer.id
        }
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar el cliente debido a restricciones de integridad en la base de datos"
        )
