import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from api.assignments_routes import app

@pytest.mark.asyncio
async def test_get_assignments():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/assignments")
        assert response.status_code == 200
        assert "Assignments retrieved successfully" in response.json()['message']

@pytest.mark.asyncio
async def test_create_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/assignments", json={
            "title": "New Assignment",
            "subject": "Math",
            "dueDate": "2023-12-31",
            "priority": "High"
        })
        assert response.status_code == 201
        assert "Assignment created successfully" in response.json()['message']

@pytest.mark.asyncio
async def test_update_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create an assignment to update
        await client.post("/assignments", json={
            "title": "Update Assignment",
            "subject": "Science",
            "dueDate": "2023-12-31",
            "priority": "Medium"
        })
        response = await client.put("/assignments/1", json={
            "title": "Updated Assignment",
            "subject": "Science",
            "dueDate": "2023-12-31",
            "priority": "Medium"
        })
        assert response.status_code == 200
        assert "Assignment updated successfully" in response.json()['message']

@pytest.mark.asyncio
async def test_delete_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create an assignment to delete
        await client.post("/assignments", json={
            "title": "Delete Assignment",
            "subject": "History",
            "dueDate": "2023-12-31",
            "priority": "Low"
        })
        response = await client.delete("/assignments/1")
        assert response.status_code == 200
        assert "Assignment deleted successfully" in response.json()['message']
