"""End-to-end B2B lifecycle integration tests.

Covers customers, catalog (products/services), orders, and dashboard.
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
async def create_customer(client: AsyncClient, *, email: str = "ops@acme.com") -> dict:
    payload = {
        "company_name": "Acme Corp",
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
# Customer Lifecycle
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_customer_success(client: AsyncClient):
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
    # The API returns 201 (FastAPI default for POST). We check for 201 specifically.
    assert resp.status_code == 201
    body = resp.json()
    assert body["company_name"] == "Global Enterprise"
    assert body["email"] == "alice.smith@global.com"


@pytest.mark.asyncio
async def test_create_customer_validation_error(client: AsyncClient):
    resp = await client.post(
        "/api/customers/",
        json={
            "company_name": "No Email LLC",
            "industry": "Finance",
            "name": "No",
            "last_name": "Mail",
            # missing email to trigger validation error
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_customer(client: AsyncClient):
    customer = await create_customer(client, email="contact@enterprise.com")
    customer_id = customer["id"]

    resp = await client.patch(
        f"/api/customers/{customer_id}",
        json={"name": "Updated", "last_name": "Contact"},
    )
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["name"] == "Updated"
    assert updated["last_name"] == "Contact"


# ---------------------------------------------------------------------------
# Service / Product Lifecycle
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_service(client: AsyncClient):
    product = await create_product(client, name="IT Security Audit", price=Decimal("15000.00"))
    assert product["name"] == "IT Security Audit"
    assert product["is_active"] is True


@pytest.mark.asyncio
async def test_soft_delete_product_with_history(client: AsyncClient):
    customer = await create_customer(client, email="history@corp.com")
    product = await create_product(client, name="Legacy Service", price=Decimal("5000.00"))

    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])
    order_id = order["id"]

    # Transition to CONFIRMED then COMPLETED to simulate history
    resp_confirm = await update_order_status(client, order_id, "confirmed")
    assert resp_confirm.status_code == 200
    resp_complete = await update_order_status(client, order_id, "completed")
    assert resp_complete.status_code == 200

    # Try to delete product: should trigger soft delete (is_active=False)
    resp_delete = await client.delete(f"/api/products/{product['id']}")
    assert resp_delete.status_code == 200
    body = resp_delete.json()
    assert body.get("action") == "deactivated"

    # Product still exists but is inactive
    resp_get = await client.get(f"/api/products/{product['id']}")
    assert resp_get.status_code == 200
    product_data = resp_get.json()
    assert product_data["is_active"] is False


# ---------------------------------------------------------------------------
# Engagements / Orders
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_create_engagement_integrity(client: AsyncClient):
    customer = await create_customer(client, email="integrity@corp.com")
    p1 = await create_product(client, name="Consulting", price=Decimal("120.50"))
    p2 = await create_product(client, name="Support", price=Decimal("79.50"))

    order = await create_order(client, customer_id=customer["id"], product_ids=[p1["id"], p2["id"]])
    total = Decimal(str(order["total_amount"]))
    assert total == Decimal("200.00")


@pytest.mark.asyncio
async def test_draft_order_cleanup(client: AsyncClient):
    customer = await create_customer(client, email="draft@corp.com")
    product = await create_product(client, name="Draft Only", price=Decimal("300.00"))

    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])
    order_id = order["id"]

    # Deactivate product: logic should remove items from draft (and order if empty)
    resp_deactivate = await client.patch(
        f"/api/products/{product['id']}", json={"is_active": False}
    )
    assert resp_deactivate.status_code == 200

    # Order should be cleaned up; GET should fail (404) because it was deleted
    resp_get_order = await client.get(f"/api/orders/{order_id}")
    assert resp_get_order.status_code == 404

    # Trying to transition a non-existent order returns 404
    resp_confirm = await update_order_status(client, order_id, "confirmed")
    assert resp_confirm.status_code == 404


@pytest.mark.asyncio
async def test_state_transition_rules(client: AsyncClient):
    customer = await create_customer(client, email="state@corp.com")
    product = await create_product(client, name="Stateful", price=Decimal("100.00"))
    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])

    # Try to transition from draft -> completed directly
    resp = await update_order_status(client, order["id"], "completed")
    assert resp.status_code == 400
    assert "Invalid status transition" in resp.json().get("detail", "")


# ---------------------------------------------------------------------------
# Dashboard / Analytics
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_dashboard_stats_accuracy(client: AsyncClient):
    customer = await create_customer(client, email="dashboard@corp.com")
    product = await create_product(client, name="Big Deal", price=Decimal("10000.00"))

    order = await create_order(client, customer_id=customer["id"], product_ids=[product["id"]])

    # Confirm order to count as active engagement
    resp_confirm = await update_order_status(client, order["id"], "confirmed")
    assert resp_confirm.status_code == 200

    current_year = datetime.utcnow().year
    resp_stats = await client.get(f"/api/dashboard/stats?year={current_year}")
    assert resp_stats.status_code == 200
    stats = resp_stats.json()

    # Float comparison caution: for exact tests consider Decimal, but for JSON response float is standard
    assert stats["kpi_cards"]["total_contract_value"] == 10000.0
    assert stats["kpi_cards"]["active_engagements"] == 1