import random
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Product, Customer, Order, OrderItem, OrderStatus


def seed_database():
    db = SessionLocal()
    try:
        print("🌱 Iniciando Sembrado de Datos B2B (Determinístico - 2026)...")

        # 1. LIMPIEZA (Borrar datos viejos)
        print("🧹 Limpiando base de datos...")
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Customer).delete()
        db.query(Product).delete()
        db.commit()

        # 2. CREAR SERVICIOS (Service Catalog)
        print("📦 Creando Catálogo de Servicios...")
        services_data = [
            # AUDIT
            {"name": "Financial Statement Audit 2026", "service_line": "Audit", "price": 15000.00},
            {"name": "Internal Controls Review (SOX)", "service_line": "Audit", "price": 8500.00},
            {"name": "Risk Assurance Audit", "service_line": "Audit", "price": 12000.00},
            
            # TAX
            {"name": "Corporate Tax Compliance", "service_line": "Tax", "price": 5000.00},
            {"name": "Transfer Pricing Study", "service_line": "Tax", "price": 18000.00},
            {"name": "M&A Tax Due Diligence", "service_line": "Tax", "price": 25000.00},
            {"name": "International Tax Structuring", "service_line": "Tax", "price": 30000.00},

            # CONSULTING
            {"name": "Cybersecurity Assessment", "service_line": "Consulting", "price": 22000.00},
            {"name": "Cloud Migration Strategy", "service_line": "Consulting", "price": 45000.00},
            {"name": "Data Analytics Implementation", "service_line": "Consulting", "price": 35000.00},
            {"name": "ESG Strategy & Reporting", "service_line": "Consulting", "price": 15000.00},
        ]

        products = []
        for svc in services_data:
            p = Product(
                name=svc["name"],
                service_line=svc["service_line"],
                price=svc["price"],
                description="Professional Service Engagement",
                is_active=True
            )
            db.add(p)
            products.append(p)
        db.commit()  # Commit para tener los IDs

        # 3. CREAR CLIENTES (Empresas)
        print("🏢 Creando Cartera de Clientes...")
        companies = [
            {"company": "Globant", "industry": "Technology", "contact": "Martin Migoya"},
            {"company": "MercadoLibre", "industry": "Technology", "contact": "Marcos Galperin"},
            {"company": "Banco Galicia", "industry": "Finance", "contact": "Fabian Kon"},
            {"company": "YPF", "industry": "Energy", "contact": "Horacio Marin"},
            {"company": "Tenaris", "industry": "Manufacturing", "contact": "Paolo Rocca"},
            {"company": "Farmacity", "industry": "Retail", "contact": "Sebastian Miranda"},
            {"company": "Toyota Argentina", "industry": "Automotive", "contact": "Gustavo Salinas"},
            {"company": "JP Morgan", "industry": "Finance", "contact": "Facundo Gomez"},
        ]

        customers = []
        for comp in companies:
            c = Customer(
                company_name=comp["company"],
                industry=comp["industry"],
                name=comp["contact"].split()[0],
                last_name=comp["contact"].split()[1],
                email=f"contact@{comp['company'].lower().replace(' ', '')}.com"
            )
            db.add(c)
            customers.append(c)
        db.commit()

        # 4. GENERAR ORDENES (Engagements) - VOLUMEN ALEATORIO POR MES
        print("📅 Generando Engagements Históricos (Ene-Dic 2026)...")
        
        order_counter = 0
        # Loop explícito por cada mes del año 2026
        for month in range(1, 13):
            # Volumen aleatorio: entre 3 y 10 órdenes por mes
            num_orders = random.randint(3, 10)
            print(f"  → Mes {month}: Generando {num_orders} órdenes...")
            
            # Generar órdenes con distribución variable de estados
            for order_idx in range(num_orders):
                # Rotar clientes para variedad
                customer = customers[order_counter % len(customers)]
                
                # Distribución aleatoria de estados (con peso hacia Confirmed/Completed)
                # Aproximadamente: 50% Confirmed, 30% Completed, 20% Draft
                status = random.choices(
                    [OrderStatus.CONFIRMED, OrderStatus.COMPLETED, OrderStatus.DRAFT],
                    weights=[5, 3, 2],
                    k=1
                )[0]
                
                # Fecha determinística dentro del mes
                day = min(7 + (order_idx * 3), 28)  # Distribuir a lo largo del mes
                hour = 9 + (order_idx % 9)  # Horas 9-17
                
                created_date = datetime(2026, month, day, hour, 0, 0)
                
                # Crear Orden (Engagement)
                order = Order(
                    customer_id=customer.id,
                    status=status,
                    created_at=created_date,
                    total_amount=0  # Se calcula después
                )
                db.add(order)
                db.flush()  # Para obtener el ID de la orden

                # Agregar Items (Servicios) - Rotar para variedad
                # Número aleatorio de servicios por orden: 1-3
                num_services = random.randint(1, 3)
                
                # Seleccionar servicios de forma rotativa
                start_idx = (order_counter * 2) % len(products)
                selected_services = products[start_idx:start_idx + num_services]
                if len(selected_services) < num_services:
                    # Wrap around si llegamos al final
                    selected_services += products[:num_services - len(selected_services)]
                
                order_total = 0
                for svc in selected_services:
                    item = OrderItem(
                        order_id=order.id,
                        product_id=svc.id,
                        unit_price=svc.price,
                        created_at=created_date  # Mismo timestamp que la orden
                    )
                    db.add(item)
                    order_total += svc.price
                
                # Actualizar total de la orden
                order.total_amount = order_total
                db.add(order)
                
                order_counter += 1

        db.commit()
        
        print(f"✅ ¡Base de datos poblada con éxito!")
        print(f"📊 Total: {order_counter} órdenes generadas (volumen variable por mes)")
        print(f"📊 {len(customers)} clientes, {len(products)} servicios")
        print("🎯 Datos listos para el Dashboard (volumen realista por mes).")

    except Exception as e:
        print(f"❌ Error durante el sembrado: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()