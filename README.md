# Internal Sales Admin Panel

## Overview
This project is a full-stack internal admin panel to manage customers, products and sales orders.
The goal is to provide a maintainable and scalable solution for internal sales operations with clear business rules and a user-friendly interface.  

## Domain
The application focuses on a simple sales domain:
- Customers: create, update, and manage customer records efficiently.
- Products: create, edit, and activate/deactivate products based on availability.
- Orders: create orders for customers, including multiple products, ensuring accurate sales tracking.

### In scope
- CRUD operations for core entities (customers, products, orders)
- Basic business rules and validations
- Clear separation between frontend and backend
- Containerized setup using Docker and Docker Compose
- AI-assisted development for productivity enhancements

### Out of scope
- Payment processing or billing
- Shipping or logistics
- External system integrations
- Advanced authorization or role management

**********************************************************************************
## Tech Stack
**Backend**
- Python
- FastAPI

**Frontend**
- React
- TypeScript
- Vite

**Infrastructure**
- Docker
- Docker Compose

**********************************************************************************

## Development Setup

The application can be run locally using Docker, without installing dependencies manually.
Both the backend and frontend are started using Docker Compose.

Make sure Docker Desktop is installed and running, then execute the following command from the project root:

```bash
docker compose up --build