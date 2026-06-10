from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

app = FastAPI()

DATA_FILE = '/home/noi-26/crewTest/spms-ai-pipeline/spms-app/api/data/tickets.json'

class Ticket(BaseModel):
    id: int
    summary: str = Field(..., max_length=255)
    description: str = Field(..., max_length=1000)
    assigned_to: str

class TicketCreate(BaseModel):
    summary: str = Field(..., max_length=255)
    description: str = Field(..., max_length=1000)
    assigned_to: str

class TicketResponse(BaseModel):
    ticket: Ticket

@app.get('/tickets/', response_model=List[Ticket], status_code=200)
async def get_tickets():
    try:
        with open(DATA_FILE, 'r') as f:
            tickets = json.load(f)
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/tickets/{ticket_id}', response_model=TicketResponse, status_code=200)
async def get_ticket(ticket_id: int):
    try:
        with open(DATA_FILE, 'r') as f:
            tickets = json.load(f)
        ticket = next((t for t in tickets if t['id'] == ticket_id), None)
        if ticket is None:
            raise HTTPException(status_code=404, detail='Ticket not found')
        return TicketResponse(ticket=Ticket(**ticket))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/tickets/', response_model=TicketResponse, status_code=201)
async def create_ticket(ticket: TicketCreate):
    try:
        with open(DATA_FILE, 'r') as f:
            tickets = json.load(f)
        new_ticket_id = max(t['id'] for t in tickets) + 1 if tickets else 1
        new_ticket = Ticket(id=new_ticket_id, **ticket.dict())
        tickets.append(new_ticket.dict())
        with open(DATA_FILE, 'w') as f:
            json.dump(tickets, f)
        return TicketResponse(ticket=new_ticket)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete('/tickets/{ticket_id}', status_code=204)
async def delete_ticket(ticket_id: int):
    try:
        with open(DATA_FILE, 'r') as f:
            tickets = json.load(f)
        ticket = next((t for t in tickets if t['id'] == ticket_id), None)
        if ticket is None:
            raise HTTPException(status_code=404, detail='Ticket not found')
        tickets.remove(ticket)
        with open(DATA_FILE, 'w') as f:
            json.dump(tickets, f)
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put('/tickets/{ticket_id}', response_model=TicketResponse, status_code=200)
async def update_ticket(ticket_id: int, ticket: TicketCreate):
    try:
        with open(DATA_FILE, 'r') as f:
            tickets = json.load(f)
        ticket_index = next((index for index, t in enumerate(tickets) if t['id'] == ticket_id), None)
        if ticket_index is None:
            raise HTTPException(status_code=404, detail='Ticket not found')
        updated_ticket = Ticket(id=ticket_id, **ticket.dict())
        tickets[ticket_index] = updated_ticket.dict()
        with open(DATA_FILE, 'w') as f:
            json.dump(tickets, f)
        return TicketResponse(ticket=updated_ticket)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
