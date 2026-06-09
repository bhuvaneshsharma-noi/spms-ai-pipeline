import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from api.tickets_routes import app, TicketCreate, TicketUpdate

@pytest.mark.asyncio
async def test_get_tickets_empty():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get('/tickets/')
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_create_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post('/tickets/', json={
            'summary': 'Test Ticket',
            'description': 'This is a test ticket.',
            'assigned_to': 'user1'
        })
    assert response.status_code == 201
    assert response.json()['summary'] == 'Test Ticket'

@pytest.mark.asyncio
async def test_get_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post('/tickets/', json={
            'summary': 'Test Ticket',
            'description': 'This is a test ticket.',
            'assigned_to': 'user1'
        })
        ticket_id = response.json()['id']
        response = await client.get(f'/tickets/{ticket_id}')
    assert response.status_code == 200
    assert response.json()['id'] == ticket_id

@pytest.mark.asyncio
async def test_update_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post('/tickets/', json={
            'summary': 'Test Ticket',
            'description': 'This is a test ticket.',
            'assigned_to': 'user1'
        })
        ticket_id = response.json()['id']
        response = await client.put(f'/tickets/{ticket_id}', json={
            'summary': 'Updated Ticket'
        })
    assert response.status_code == 200
    assert response.json()['summary'] == 'Updated Ticket'

@pytest.mark.asyncio
async def test_delete_ticket():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post('/tickets/', json={
            'summary': 'Test Ticket',
            'description': 'This is a test ticket.',
            'assigned_to': 'user1'
        })
        ticket_id = response.json()['id']
        response = await client.delete(f'/tickets/{ticket_id}')
    assert response.status_code == 204

@pytest.mark.asyncio
async def test_get_ticket_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get('/tickets/999')
    assert response.status_code == 404
    assert response.json() == {'detail': 'Ticket not found'}

@pytest.mark.asyncio
async def test_update_ticket_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.put('/tickets/999', json={
            'summary': 'Updated Ticket'
        })
    assert response.status_code == 404
    assert response.json() == {'detail': 'Ticket not found'}

@pytest.mark.asyncio
async def test_delete_ticket_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.delete('/tickets/999')
    assert response.status_code == 404
    assert response.json() == {'detail': 'Ticket not found'}