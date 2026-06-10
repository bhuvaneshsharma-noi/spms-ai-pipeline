import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from api.ticket_routes import app

@pytest.mark.asyncio
async def test_get_tickets():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/tickets/")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_get_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/tickets/1")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_get_ticket_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/tickets/999")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_create_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/tickets/", json={"summary": "Test Ticket", "description": "Test Description", "assigned_to": "Tester"})
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_delete_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.delete("/tickets/1")
    assert response.status_code == 204

@pytest.mark.asyncio
async def test_update_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.put("/tickets/1", json={"summary": "Updated Ticket", "description": "Updated Description", "assigned_to": "Tester"})
    assert response.status_code == 200
