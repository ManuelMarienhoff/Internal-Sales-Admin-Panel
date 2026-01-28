# Internal Sales Admin Panel (PwC Challenge)

**Live Demo:** [https://sales-panel-pwc.vercel.app/](https://sales-panel-pwc.vercel.app/)

## 1. System Description
This project is a **Full-Stack B2B management application** specifically designed to align with the **PricewaterhouseCoopers (PwC)** ecosystem, modeling an **internal sales workflow** where orders are created by internal users to register and manage sales that happen outside of the system, such as through direct contact with customers.
**Target Device:** Desktop / Laptop. The UI is optimized for large screens to handle complex data grids and dashboards efficiently.

This tool has been modeled to reflect the firm's operational reality:
* **Business Model:** We do not sell quantity-based products, but high-value **Engagements** 
* **Corporate Identity:** The interface strictly adheres to the brand's style guide, implementing the official color palette and sober typography to reduce cognitive load.
* **Service Lines:** The system is pre-configured to manage the firm's real verticals: **Assurance, Tax, and Advisory**.

The goal is to provide a centralized tool that allows partners and managers to monitor the corporate sales lifecycle in real-time.

## 2. Table of Contents
1.  [System Description](#1-system-description)
2.  [Table of Contents](#2-table-of-contents)
3.  [Tech Stack & Architecture](#3-tech-stack--architecture)
4.  [AI Development Strategy](#4-ai-development-strategy)
5.  [Design Decisions & Trade-offs](#5-design-decisions--trade-offs)
6.  [How to Run the Project](#6-how-to-run-the-project)
7.  [Testing & Quality Assurance](#7-testing--quality-assurance)
8.  [Future Improvements](#8-future-improvements)

## 3. Tech Stack & Architecture
I designed the system with a **strict separation of concerns**, using **Docker** to containerize the entire environment.

* **Backend:** Python + FastAPI. I chose FastAPI for its native data validation with Pydantic. I used SQLAlchemy as the ORM and PostgreSQL to ensure relational data integrity.
* **Frontend:** React + TypeScript + Tailwind CSS. I used TanStack Query to manage server state and caching, avoiding unnecessary "prop drilling."
* **Infrastructure:** The entire stack is orchestrated via `docker-compose`.

---

## 4. AI Development Strategy
For this project, I used AI as a productivity accelerator under a strict **Structured Prompt Engineering** methodology. My goal was to delegate repetitive code implementation (boilerplate) to focus on business logic and architecture.

### 4.1. Structured Prompting Methodology
To avoid hallucinations or "spaghetti code," I designed my prompts always following a three-block structure to keep the scope defined and facilitate subsequent auditing:

1.  **Context:** Explained the current situation (e.g., *"I have an error in endpoint X"*).
2.  **Functionality:** Enumerated step-by-step what I wanted the code to do (e.g., *"1. Create model, 2. Create schema"*).
3.  **Important (Constraints):** Defined critical rules that could not be overlooked (e.g., *"Do not delete the database, use Soft Delete,"* *"Keep Pydantic types strict"*).

**Result:** By narrowing the scope of each request, the generated code was predictable, functional, and much easier to review.

### 4.2. Infrastructure & Data Acceleration
AI was fundamental in eliminating manual initial configuration work:
* **Data Modeling:** Instead of manually writing each SQLAlchemy and Pydantic class, I supplied the AI with the list of entities and their relationships. The AI automatically generated the schemas with their type validations and Foreign Keys.
* **CRUD Generation:** Once the models were defined, I used AI to mass-generate standard endpoints (Create, Read, Update, Delete). This allowed me to have a functional API in minutes.
* **Intelligent Data Seeding:** To test the UI with realistic scenarios, I used AI to create a seed script (`seed_data.py`). I specifically instructed it to generate data with B2B semantics (real corporate names, audit services) instead of generic filler data, which greatly facilitated UX and Dashboard testing.

### 4.3. Context-Aware Integral Testing
My strategy was to feed the AI with the full context of my critical files (`schemas.py` for constraints, `models.py` for structure, and `routers` for logic) and request a robust test suite in `pytest`.
**Result:** The AI generated complex test cases (such as the full Order lifecycle: *Create -> Validate -> Complete*) covering validations that might have been manually overlooked, reducing QA development time.

### 4.4. Business Refactoring: B2C to B2B Migration
A key point in development was the evolution of the business model. Initially, I built a basic panel with B2C (Retail) logic. Subsequently, I decided to pivot towards a B2B model (Professional Services).
* **The AI Role:** I asked the AI to refactor existing models to adapt to this new reality.
* **Applied Changes:** Transforming "Products with Stock" to "Intangible Services," and adapting the "Customer" entity to "Corporate Client." Thanks to the structured prompts, this complex migration was carried out while maintaining database integrity.

---

## 5. Design Decisions & Trade-offs
I made conscious decisions to meet the deadline without sacrificing the quality of the core application:

* **Terminology Layer:** The database uses standard names (`orders`, `products`), but the Frontend implements an adaptation layer to display business terminology (`Engagements`, `Services`). This keeps the DB clean but the UX aligned with the user.
* **Scope (Out of Scope):**
    * **Authentication:** I decided not to implement Login/JWT to prioritize the complexity of the Dashboard and relational CRUDs. I assumed a secure intranet environment for this MVP.
    * **Fine-grained Error Handling:** The backend sends detailed errors (422), but the frontend prioritizes the "Happy Path" and general alerts instead of mapping errors field-by-field.

## 6. How to Run the Project
You only need **Docker** and **Git**.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ManuelMarienhoff/Internal-Sales-Admin-Panel.git
    cd internal-sales-admin-panel
    ```

2.  **Start the environment (Backend + Frontend + DB):**
    ```bash
    docker-compose up --build
    ```

3.  **Populate with Demo Data (Optional but Recommended):**
    Open a new terminal and run the seed script to load sample B2B data (Clients, Services, Orders) for testing purposes:
    ```bash
    docker-compose exec backend python seed_data.py
    ```

4.  **Access the app:**
    * **App:** [http://localhost:5173](http://localhost:5173)
    * **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 7. Testing & Quality Assurance
The project includes a suite of automated integration tests to ensure business logic integrity (e.g., B2B flows, state machine transitions).

### 7.1. Running Automated Tests
**Prerequisites:** Ensure the application is running before executing tests.

1.  **Start the environment** (if not already running):
    ```bash
    docker-compose up -d --build
    ```
    *(Wait ~30 seconds for the database to initialize)*.

2.  **Execute the test suite** inside the backend container:
    ```bash
    docker-compose exec backend pytest
    ```

    **Key scenarios covered**
* **B2B Logic:** Validates that creating an order freezes product prices.
* **State Machine:** Ensures an order cannot jump from 'Draft' to 'Completed' without passing through 'Confirmed'.
* **Referential Safety:** Prevents deletion of clients/services involved in active orders.

## 8. Future Improvements
If I had more time to iterate on the product, my priority would be to deepen the business logic and technical scalability:

1.  **Advanced Resource & Profitability Management (HR Logic):**
    * Implement an *Employee* entity to assign specific consultants to each Engagement.
    * **Man-Hours Logic:** Enable tracking of billable hours per project to calculate the actual cost of delivery versus the contract price (*Profitability Analysis*).
    * **Talent Management:** Visualize team utilization to optimize resource allocation across projects.

2.  **Advanced Dashboard & Analytics:**
    * **Dynamic Filtering:** Implement filters for time-series charts to allow analysis by Industry, Service Line, or Client Tier.
    * **Revenue Breakdown:** Add specific visualizations for *Revenue by Customer* and *Revenue by Service Line* to identify top-performing accounts and verticals.
    * **Drill-Down Capabilities:** Allow clicking on dashboard metrics to view the underlying granular data.

3.  **Data Infrastructure (Alembic & Migrations):**
    * Integrate **Alembic** for database version control.
    * **Why?** Implementing the HR logic (Point 1) requires modifying existing tables. Alembic would allow for schema evolution (adding columns, new relationships) without needing to wipe the database and lose historical transactional data.

4.  **Data Science & Forecasting:**
    * Feed the Dashboard with the new timesheet and allocation data to generate predictive insights.
    * **Use Cases:** Forecast future demand by industry, estimate operational capacity required for the next Quarter, and detect margin slippage in real-time.

5.  **Security:** Implement **JWT authentication** and **Role-Based Access Control** (*Admin* vs. *Sales Associate*).

