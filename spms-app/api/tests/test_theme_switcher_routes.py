import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from api.theme_switcher_routes import app

@pytest.mark.asyncio
async def test_get_themes():
    async with AsyncClient(app=app, base_url='http://test') as client:
        response = await client.get('/themes')
        assert response.status_code == 200
        assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_switch_theme():
    async with AsyncClient(app=app, base_url='http://test') as client:
        response = await client.post('/themes/switch', json={'name': 'white', 'color': '#FFFFFF'})
        assert response.status_code == 201
        assert response.json()['message'] == 'Theme switched successfully'

@pytest.mark.asyncio
async def test_get_theme():
    async with AsyncClient(app=app, base_url='http://test') as client:
        response = await client.get('/themes/white')
        assert response.status_code == 200
        assert response.json()['name'] == 'white'
