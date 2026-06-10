from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

app = FastAPI()

# Define the path for the JSON data file
DATA_FILE = '/home/noi-26/crewTest/spms-ai-pipeline/spms-app/api/data/tickets.json'

# Pydantic models
class Ticket(BaseModel):
    id: int
    summary: str
    description: str
    assigned_to: str
    status: str

class TicketCreate(BaseModel):
    summary: str = Field(..., max_length=255)
    description: str = Field(..., max_length=1000)
    assigned_to: str = Field(..., max_length=50)
    status: str = Field(..., max_length=50)

class TicketUpdate(BaseModel):
    summary: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, max_length=50)

# Helper functions
def read_tickets_from_file() -> List[Ticket]:
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return [Ticket(**ticket) for ticket in json.load(file)]

def write_tickets_to_file(tickets: List[Ticket]) -> None:
    with open(DATA_FILE, 'w') as file:
        json.dump([ticket.dict() for ticket in tickets], file)

# API Endpoints
@app.get('/tickets/', response_model=List[Ticket])
async def get_tickets():
    """Retrieve all tickets."""
    return read_tickets_from_file()

@app.get('/tickets/{ticket_id}', response_model=Ticket)
async def get_ticket(ticket_id: int):
    """Retrieve a ticket by its ID."""
    tickets = read_tickets_from_file()
    for ticket in tickets:
        if ticket.id == ticket_id:
            return ticket
    raise HTTPException(status_code=404, detail='Ticket not found')

@app.post('/tickets/', response_model=Ticket, status_code=201)
async def create_ticket(ticket: TicketCreate):
    """Create a new ticket."""
    tickets = read_tickets_from_file()
    new_ticket = Ticket(id=len(tickets) + 1, **ticket.dict())
    tickets.append(new_ticket)
    write_tickets_to_file(tickets)
    return new_ticket

@app.put('/tickets/{ticket_id}', response_model=Ticket)
async def update_ticket(ticket_id: int, ticket_update: TicketUpdate):
    """Update an existing ticket by its ID."""
    tickets = read_tickets_from_file()
    for index, ticket in enumerate(tickets):
        if ticket.id == ticket_id:
            updated_ticket = ticket.copy(update=ticket_update.dict(exclude_unset=True))
            tickets[index] = updated_ticket
            write_tickets_to_file(tickets)
            return updated_ticket
    raise HTTPException(status_code=404, detail='Ticket not found')

@app.delete('/tickets/{ticket_id}', status_code=204)
async def delete_ticket(ticket_id: int):
    """Delete a ticket by its ID."""
    tickets = read_tickets_from_file()
    for index, ticket in enumerate(tickets):
        if ticket.id == ticket_id:
            del tickets[index]
            write_tickets_to_file(tickets)
            return
    raise HTTPException(status_code=404, detail='Ticket not found')
