from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel, constr
from typing import List, Optional
import json
import os

app = FastAPI()

# Define the path for the JSON data file
DATA_FILE = '/home/noi-26/crewTest/spms-ai-pipeline/spms-app/api/data/tickets.json'

# Pydantic models
class Ticket(BaseModel):
    id: int
    summary: constr(min_length=1)
    description: constr(min_length=1)
    assigned_to: str

class TicketCreate(BaseModel):
    summary: constr(min_length=1)
    description: constr(min_length=1)
    assigned_to: str

class TicketUpdate(BaseModel):
    summary: Optional[constr(min_length=1)] = None
    description: Optional[constr(min_length=1)] = None

# Helper functions
def read_tickets_from_file() -> List[Ticket]:
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return [Ticket(**ticket) for ticket in json.load(file)]

def write_tickets_to_file(tickets: List[Ticket]) -> None:
    with open(DATA_FILE, 'w') as file:
        json.dump([ticket.dict() for ticket in tickets], file)

@app.get('/tickets/', response_model=List[Ticket])
async def get_tickets(assigned_to: Optional[str] = Query(None)):
    """
    Retrieve a list of tickets, optionally filtered by the assigned user.
    
    - **assigned_to**: Filter tickets by the user they are assigned to.
    """
    tickets = read_tickets_from_file()
    if assigned_to:
        tickets = [ticket for ticket in tickets if ticket.assigned_to == assigned_to]
    return tickets

@app.get('/tickets/{ticket_id}', response_model=Ticket)
async def get_ticket(ticket_id: int = Path(..., gt=0)):
    """
    Retrieve a ticket by its ID.
    
    - **ticket_id**: The ID of the ticket to retrieve.
    """
    tickets = read_tickets_from_file()
    for ticket in tickets:
        if ticket.id == ticket_id:
            return ticket
    raise HTTPException(status_code=404, detail='Ticket not found')

@app.post('/tickets/', response_model=Ticket, status_code=201)
async def create_ticket(ticket: TicketCreate):
    """
    Create a new ticket.
    
    - **ticket**: The ticket to create.
    """
    tickets = read_tickets_from_file()
    new_ticket = Ticket(id=len(tickets) + 1, **ticket.dict())
    tickets.append(new_ticket)
    write_tickets_to_file(tickets)
    return new_ticket

@app.put('/tickets/{ticket_id}', response_model=Ticket)
async def update_ticket(ticket_id: int = Path(..., gt=0), ticket_update: TicketUpdate):
    """
    Update an existing ticket by its ID.
    
    - **ticket_id**: The ID of the ticket to update.
    - **ticket_update**: The updated ticket data.
    """
    tickets = read_tickets_from_file()
    for index, ticket in enumerate(tickets):
        if ticket.id == ticket_id:
            updated_ticket = ticket.copy(update=ticket_update.dict(exclude_unset=True))
            tickets[index] = updated_ticket
            write_tickets_to_file(tickets)
            return updated_ticket
    raise HTTPException(status_code=404, detail='Ticket not found')

@app.delete('/tickets/{ticket_id}', status_code=204)
async def delete_ticket(ticket_id: int = Path(..., gt=0)):
    """
    Delete a ticket by its ID.
    
    - **ticket_id**: The ID of the ticket to delete.
    """
    tickets = read_tickets_from_file()
    for index, ticket in enumerate(tickets):
        if ticket.id == ticket_id:
            del tickets[index]
            write_tickets_to_file(tickets)
            return
    raise HTTPException(status_code=404, detail='Ticket not found')
