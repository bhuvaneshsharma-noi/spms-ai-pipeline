from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

app = FastAPI()

DATA_FILE = 'data/assignments.json'

class Assignment(BaseModel):
    id: Optional[int] = Field(default=None, description="The unique identifier for the assignment")
    title: str = Field(..., description="The title of the assignment")
    subject: str = Field(..., description="The subject of the assignment")
    dueDate: str = Field(..., description="The due date of the assignment in YYYY-MM-DD format")
    priority: str = Field(..., description="The priority of the assignment")

class AssignmentResponse(BaseModel):
    message: str
    assignment: Assignment

class AssignmentsResponse(BaseModel):
    message: str
    assignments: List[Assignment]

def read_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return json.load(file)

def write_data(data):
    with open(DATA_FILE, 'w') as file:
        json.dump(data, file, indent=4)

@app.get('/assignments', response_model=AssignmentsResponse)
async def get_assignments():
    assignments = read_data()
    return AssignmentsResponse(message="Assignments retrieved successfully", assignments=assignments)

@app.post('/assignments', response_model=AssignmentResponse, status_code=201)
async def create_assignment(assignment: Assignment):
    assignments = read_data()
    assignment.id = len(assignments) + 1
    assignments.append(assignment.dict())
    write_data(assignments)
    return AssignmentResponse(message="Assignment created successfully", assignment=assignment)

@app.put('/assignments/{id}', response_model=AssignmentResponse)
async def update_assignment(id: int = Path(..., description="The ID of the assignment to update"), assignment: Assignment):
    assignments = read_data()
    for idx, existing_assignment in enumerate(assignments):
        if existing_assignment['id'] == id:
            assignments[idx] = assignment.dict()
            assignments[idx]['id'] = id
            write_data(assignments)
            return AssignmentResponse(message="Assignment updated successfully", assignment=assignment)
    raise HTTPException(status_code=404, detail="Assignment not found")

@app.delete('/assignments/{id}', response_model=AssignmentResponse)
async def delete_assignment(id: int = Path(..., description="The ID of the assignment to delete")):
    assignments = read_data()
    for idx, existing_assignment in enumerate(assignments):
        if existing_assignment['id'] == id:
            del assignments[idx]
            write_data(assignments)
            return AssignmentResponse(message="Assignment deleted successfully", assignment=existing_assignment)
    raise HTTPException(status_code=404, detail="Assignment not found")
