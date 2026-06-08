from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

app = FastAPI()

# Define the path for the JSON file
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'assignments.json')

# Pydantic models
class Assignment(BaseModel):
    id: Optional[int] = Field(default=None, description="The unique identifier for the assignment")
    title: str = Field(..., description="The title of the assignment")
    subject: str = Field(..., description="The subject of the assignment")
    dueDate: str = Field(..., description="The due date of the assignment in YYYY-MM-DD format")
    priority: str = Field(..., description="The priority of the assignment")

class AssignmentList(BaseModel):
    assignments: List[Assignment]

# Helper functions
def read_data() -> List[Assignment]:
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return [Assignment(**item) for item in json.load(file)]

def write_data(assignments: List[Assignment]):
    with open(DATA_FILE, 'w') as file:
        json.dump([assignment.dict() for assignment in assignments], file)

# API Endpoints
@app.get("/assignments", response_model=AssignmentList)
async def get_assignments():
    """Retrieve all assignments"""
    assignments = read_data()
    return AssignmentList(assignments=assignments)

@app.post("/assignments", response_model=Assignment, status_code=201)
async def create_assignment(assignment: Assignment):
    """Create a new assignment"""
    assignments = read_data()
    assignment.id = len(assignments) + 1  # Simple ID assignment
    assignments.append(assignment)
    write_data(assignments)
    return assignment

@app.put("/assignments/{id}", response_model=Assignment)
async def update_assignment(id: int = Path(..., description="The ID of the assignment to update"), assignment: Assignment):
    """Update an existing assignment"""
    assignments = read_data()
    for index, existing_assignment in enumerate(assignments):
        if existing_assignment.id == id:
            assignments[index] = assignment
            assignment.id = id  # Maintain the same ID
            write_data(assignments)
            return assignment
    raise HTTPException(status_code=404, detail="Assignment not found")

@app.delete("/assignments/{id}", status_code=204)
async def delete_assignment(id: int = Path(..., description="The ID of the assignment to delete")):
    """Delete an assignment"""
    assignments = read_data()
    for index, existing_assignment in enumerate(assignments):
        if existing_assignment.id == id:
            del assignments[index]
            write_data(assignments)
            return
    raise HTTPException(status_code=404, detail="Assignment not found")
