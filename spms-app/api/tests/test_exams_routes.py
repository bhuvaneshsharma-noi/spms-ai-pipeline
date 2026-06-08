import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.exams_routes import app

@pytest.mark.asyncio
async def test_get_exams():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get('/exams')
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_exam():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post('/exams', json={'title': 'Test Exam', 'subject': 'Science'})
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_delete_exam():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.delete('/exams/1')
    assert response.status_code == 204