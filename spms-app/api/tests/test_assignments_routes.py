import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from api.assignments_routes import app

@pytest.mark.asyncio
async def test_get_assignments():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get('/assignments')
        assert response.status_code == 200
        assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post('/assignments', json={
            'title': 'New Assignment',
            'subject': 'Science',
            'dueDate': '2023-10-10',
            'priority': 'Medium'
        })
        assert response.status_code == 201
        assert response.json()['message'] == 'Assignment created successfully'

@pytest.mark.asyncio
async def test_update_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create an assignment to update
        create_response = await client.post('/assignments', json={
            'title': 'Update Assignment',
            'subject': 'Math',
            'dueDate': '2023-10-10',
            'priority': 'Low'
        })
        assignment_id = create_response.json()['assignment']['id']

        # Now update the assignment
        update_response = await client.put(f'/assignments/{assignment_id}', json={
            'title': 'Updated Assignment',
            'subject': 'Math',
            'dueDate': '2023-10-15',
            'priority': 'High'
        })
        assert update_response.status_code == 200
        assert update_response.json()['message'] == 'Assignment updated successfully'

@pytest.mark.asyncio
async def test_delete_assignment():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create an assignment to delete
        create_response = await client.post('/assignments', json={
            'title': 'Delete Assignment',
            'subject': 'History',
            'dueDate': '2023-10-20',
            'priority': 'Low'
        })
        assignment_id = create_response.json()['assignment']['id']

        # Now delete the assignment
        delete_response = await client.delete(f'/assignments/{assignment_id}')
        assert delete_response.status_code == 204
