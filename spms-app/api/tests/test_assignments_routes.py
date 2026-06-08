import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from api.assignments_routes import app

@pytest.mark.asyncio
async def test_get_assignments():
    async with AsyncClient(app=app, base_url='http://test') as client:
        response = await client.get('/assignments')
    assert response.status_code == 200
    assert 'assignments' in response.json()

@pytest.mark.asyncio
async def test_create_assignment():
    async with AsyncClient(app=app, base_url='http://test') as client:
        response = await client.post('/assignments', json={'title': 'New Assignment', 'subject': 'Science', 'dueDate': '2023-10-10', 'priority': 'medium'})
    assert response.status_code == 201
    assert response.json()['title'] == 'New Assignment'

@pytest.mark.asyncio
async def test_update_assignment():
    async with AsyncClient(app=app, base_url='http://test') as client:
        response = await client.put('/assignments/1', json={'title': 'Updated Assignment', 'subject': 'Math', 'dueDate': '2023-10-10', 'priority': 'high'})
    assert response.status_code == 200
    assert response.json()['title'] == 'Updated Assignment'

@pytest.mark.asyncio
async def test_delete_assignment():
    async with AsyncClient(app=app, base_url='http://test') as client:
        response = await client.delete('/assignments/1')
    assert response.status_code == 204