import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.assignments_routes import app

@pytest.mark.asyncio
async def test_get_assignments():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get('/assignments')
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post('/assignments', json={'title': 'Test Assignment', 'subject': 'Math'})
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_update_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.put('/assignments/1', json={'title': 'Updated Assignment'})
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_delete_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.delete('/assignments/1')
    assert response.status_code == 204