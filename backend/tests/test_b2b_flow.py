"""End-to-end B2B lifecycle integration tests.

Covers:
1. Customer Lifecycle (CRUD)
2. Service Catalog (Soft Deletes)
3. Order Flow (Creation, State Transitions)
4. Dashboard Analytics (Accuracy)
5. Advanced Features (Pagination, Search, Edge Cases)
6. Integrity & Business Rules

Uses the `client` (AsyncClient) and `db_session` fixtures defined in conftest.py.
Each test is isolated thanks to the transaction rollback strategy.
"""

from __future__ import annotations

from decimal import Decimal
from datetime import datetime

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def create_customer(client: AsyncClient, *, company_name: str = "Acme Corp", email: str = "ops@acme.com") -> dict:
    payload = {
        "company_name": company_name,
        "industry": "Technology",
        "name": "Jane",
        "last_name": "Doe",
        "email": email,
    }
    resp = await client.post("/api/customers/", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def create_product(client: AsyncClient, *, name: str, price: Decimal, is_active: bool = True) -> dict:
    payload = {
        "name": name,
        "service_line": "IT Services",
        "description": f"Service {name}",
        "price": str(price),  # send as string to keep decimal precision
        "is_active": is_active,
    }
    resp = await client.post("/api/products/", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def create_order(client: AsyncClient, *, customer_id: int, product_ids: list[int]) -> dict:
    payload = {
        "customer_id": customer_id,
        "items": [{"product_id": pid} for pid in product_ids],
    }
    resp = await client.post("/api/orders/", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def update_order_status(client: AsyncClient, order_id: int, status: str) -> dict:
    resp = await client.patch(f"/api/orders/{order_id}", json={"status": status})
    return resp


# ---------------------------------------------------------------------------
# 1. Customer Lifecycle
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_customer_success(client: AsyncClient):
    """
    Scenario: Happy Path Customer Creation.
    Action: Create a new Enterprise customer with all valid fields.
    Expected: 201 Created response and correct data persistence.
    """
    resp = await client.post(
        "/api/customers/",
        json={
            "company_name": "Global Enterprise",
            "industry": "Enterprise IT",
            "name": "Alice",
            "last_name": "Smith",
            "email": "alice.smith@global.com",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["company_name"] == "Global Enterprise"
    assert body["email"] == "alice.smith@global.com"


@pytest.mark.asyncio
async def test_create_customer_validation_error(client: AsyncClient):
    """
    Scenario: Missing Mandatory Field.
    Action: Try to create a customer without an email address.
    Expected: 422 Validation Error (Unprocessable Entity).
    """
    resp = await client.post(
        "/api/customers/",
        json={
            "company_name": "No Email LLC",
            "industry": "Finance",
            # missing email to trigger validation error
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_customer(client: AsyncClient):
    """
    Scenario: Customer Detail Update.
    Action: Update the contact name and last name of an existing customer.
    Expected: 200 OK and updated fields in response.
    """
    customer = await create_customer(client, email="contact@enterprise.com")
    customer_id = customer["id"]

    resp = await client.patch(
        f"/api/customers/{customer_id}",
        json={"name": "Updated", "last_name": "Contact"},
    )
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["name"] == "Updated"


# ---------------------------------------------------------------------------
# 2. Service / Product Lifecycle
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_service(client: AsyncClient):
    """
    Scenario: Service Creation.
    Action: Create a new service item in the catalog.
    Expected: 201 Created and item defaults to 'is_active=True'.
    """
    product = await create_product(client, name="IT Security Audit", price=Decimal("15000.00"))
    assert product["name"] == "IT Security Audit"
    assert product["is_active"] is True


@pytest.mark.asyncio
async def test_soft_delete_product_with_history(client: AsyncClient):
    """
    Scenario: Soft Deletion of Used Products.
    1. Create a product and use it in a historical (completed) order.
    2. Try to delete the product.
    Expected: Product is NOT removed from DB (to preserve history) but 'is_active' becomes False.
    """
    customer = await create_customer(client, email="history@corp.com")
    product = await create_product(client, name="Legacy Service", price=Decimal("5000.00"))

    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])
    order_id = order["id"]

    # Transition to CONFIRMED then COMPLETED to simulate history
    await update_order_status(client, order_id, "confirmed")
    await update_order_status(client, order_id, "completed")

    # Try to delete product
    resp_delete = await client.delete(f"/api/products/{product['id']}")
    assert resp_delete.status_code == 200
    
    # Product still exists but is inactive
    resp_get = await client.get(f"/api/products/{product['id']}")
    assert resp_get.json()["is_active"] is False


# ---------------------------------------------------------------------------
# 3. Engagements / Orders (Core Logic)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_engagement_integrity(client: AsyncClient):
    """
    Scenario: Financial Integrity Check.
    Action: Create an order with multiple items ($120.50 + $79.50).
    Expected: Order 'total_amount' is exactly $200.00.
    """
    customer = await create_customer(client, email="integrity@corp.com")
    p1 = await create_product(client, name="Consulting", price=Decimal("120.50"))
    p2 = await create_product(client, name="Support", price=Decimal("79.50"))

    order = await create_order(client, customer_id=customer["id"], product_ids=[p1["id"], p2["id"]])
    total = Decimal(str(order["total_amount"]))
    assert total == Decimal("200.00")


@pytest.mark.asyncio
async def test_state_transition_rules(client: AsyncClient):
    """
    Scenario: State Machine Enforcement.
    Action: Try to jump from 'DRAFT' directly to 'COMPLETED'.
    Expected: 400 Bad Request (Invalid transition).
    """
    customer = await create_customer(client, email="state@corp.com")
    product = await create_product(client, name="Stateful", price=Decimal("100.00"))
    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])

    # Try to transition from draft -> completed directly (Forbidden)
    resp = await update_order_status(client, order["id"], "completed")
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# 4. Advanced: Pagination, Search & Constraints
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_list_orders_pagination(client: AsyncClient):
    """
    Scenario: Pagination Logic.
    Action: Create 15 orders, request page 1 (limit 10) and page 2 (limit 10).
    Expected: Page 1 returns 10 items, Page 2 returns the remaining 5 items.
    """
    customer = await create_customer(client, email="paginator@corp.com")
    product = await create_product(client, name="Item", price=Decimal("10.00"))

    # Create 15 orders
    for _ in range(15):
        await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])

    # Page 1: Limit 10
    resp_page1 = await client.get("/api/orders/?limit=10&skip=0")
    assert resp_page1.status_code == 200
    data = resp_page1.json()
    assert len(data["items"]) == 10

    # Page 2: Limit 10 (should return remaining 5)
    resp_page2 = await client.get("/api/orders/?limit=10&skip=10")
    assert resp_page2.status_code == 200
    data_page2 = resp_page2.json()
    assert len(data_page2["items"]) == 5


@pytest.mark.asyncio
async def test_search_orders_by_customer(client: AsyncClient):
    """
    Scenario: Customer Search.
    Action: Create orders for 'Alpha Corp' and 'Beta Ltd', then search for 'Alpha'.
    Expected: Only orders belonging to 'Alpha Corp' are returned.
    """
    c1 = await create_customer(client, company_name="Alpha Corp", email="alpha@test.com")
    c2 = await create_customer(client, company_name="Beta Ltd", email="beta@test.com")
    p = await create_product(client, name="Serv", price=Decimal("100"))

    await create_order(client, customer_id=c1["id"], product_ids=[p["id"]]) # Order for Alpha
    await create_order(client, customer_id=c2["id"], product_ids=[p["id"]]) # Order for Beta

    # Search for 'Alpha' using the correct parameter 'search'
    resp = await client.get("/api/orders/?search=Alpha")
    assert resp.status_code == 200
    
    data = resp.json()["items"]
    
    assert len(data) >= 1
    # Verify we didn't get Beta's orders
    for order in data:
        assert order["customer"]["company_name"] == "Alpha Corp"


@pytest.mark.asyncio
async def test_cannot_modify_confirmed_order(client: AsyncClient):
    """
    Scenario: Order Locking on Confirmation.
    Action: Confirm an order and then try to modify its items via PATCH.
    Expected: 400/403 Error (Modification of confirmed orders is forbidden).
    """
    customer = await create_customer(client, email="locked@corp.com")
    product = await create_product(client, name="Lock", price=Decimal("100"))
    
    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])
    
    # Confirm it
    await update_order_status(client, order["id"], "confirmed")

    # Try to modify items (mocking a PATCH items request)
    resp = await client.patch(
        f"/api/orders/{order['id']}", 
        json={"items": [{"product_id": product["id"]}]}
    )
    assert resp.status_code in [400, 422, 403] 


@pytest.mark.asyncio
async def test_delete_draft_order_success(client: AsyncClient):
    """
    Scenario: Draft Deletion.
    Action: Delete an order that is still in 'DRAFT' status.
    Expected: 200/204 Success, and subsequent GET returns 404.
    """
    customer = await create_customer(client, email="del@corp.com")
    product = await create_product(client, name="Temp", price=Decimal("10"))
    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])

    resp_del = await client.delete(f"/api/orders/{order['id']}")
    assert resp_del.status_code in [200, 204]

    # Verify it's gone
    resp_get = await client.get(f"/api/orders/{order['id']}")
    assert resp_get.status_code == 404


@pytest.mark.asyncio
async def test_cannot_delete_completed_order(client: AsyncClient):
    """
    Scenario: Financial Record Protection.
    Action: Try to delete an order that has been 'COMPLETED'.
    Expected: 400/403 Error (Deletion forbidden for finalized orders).
    """
    customer = await create_customer(client, email="financial@corp.com")
    product = await create_product(client, name="Audit", price=Decimal("500"))
    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])

    await update_order_status(client, order["id"], "confirmed")
    await update_order_status(client, order["id"], "completed")

    resp_del = await client.delete(f"/api/orders/{order['id']}")
    assert resp_del.status_code in [400, 403]


# ---------------------------------------------------------------------------
# 5. Dashboard / Analytics
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_dashboard_stats_accuracy(client: AsyncClient):
    """
    Scenario: Dashboard KPI Accuracy.
    Action: Create a confirmed order of $10,000.
    Expected: Dashboard returns exactly $10,000 TCV and 1 Active Engagement.
    """
    customer = await create_customer(client, email="dashboard@corp.com")
    product = await create_product(client, name="Big Deal", price=Decimal("10000.00"))

    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])
    await update_order_status(client, order["id"], "confirmed")

    current_year = datetime.utcnow().year
    resp_stats = await client.get(f"/api/dashboard/stats?year={current_year}")
    assert resp_stats.status_code == 200
    stats = resp_stats.json()

    assert stats["kpi_cards"]["total_contract_value"] == 10000.0
    assert stats["kpi_cards"]["active_engagements"] == 1


# ---------------------------------------------------------------------------
# 6. Integrity & Business Rules
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_cannot_confirm_order_with_inactive_items(client: AsyncClient):
    """
    Scenario: 'Zombie Items' Cleanup Verification.
    1. Create Draft Order with 1 item.
    2. Deactivate the Product.
    3. Try to Confirm the Order.
    Expected: 404 Not Found.
    Why? The system's 'Draft Cleanup' logic (tested in test_draft_order_cleanup)
    automatically removes draft orders that become empty due to product deactivation.
    Therefore, the order no longer exists to be confirmed.
    """
    customer = await create_customer(client, email="zombie@corp.com")
    product = await create_product(client, name="To Be Deleted", price=Decimal("50"))
    
    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])
    
    # Deactivate product directly (simulating admin action)
    await client.patch(f"/api/products/{product['id']}", json={"is_active": False})
    
    # Try to confirm
    resp = await update_order_status(client, order["id"], "confirmed")
    
    # Assert 404 because the order was auto-deleted
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_customer_email_uniqueness(client: AsyncClient):
    """
    Scenario: Duplicate Email Prevention.
    1. Create Customer A with email X.
    2. Try to Create Customer B with email X.
    Expected: 400 or 409 Conflict (Should not fail with 500).
    """
    email = "unique@test.com"
    await create_customer(client, company_name="Corp A", email=email)
    
    # Try creating another one with same email
    resp = await client.post(
        "/api/customers/",
        json={
            "company_name": "Corp B",
            "industry": "Tech",
            "name": "Clone",
            "last_name": "User",
            "email": email
        },
    )

    assert resp.status_code in [400, 409, 422] 


@pytest.mark.asyncio
async def test_product_negative_price_validation(client: AsyncClient):
    """
    Scenario: Price Sanity Check.
    Action: Try to create a product with negative price.
    Expected: 422 Validation Error (Pydantic schema validation).
    """
    resp = await client.post(
        "/api/products/",
        json={
            "name": "Bad Price",
            "service_line": "Audit",
            "price": "-50.00", # Negative price
            "is_active": True
        }
    )
    assert resp.status_code == 422