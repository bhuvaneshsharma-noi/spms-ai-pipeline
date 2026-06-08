from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

app = FastAPI()

# Define the path for the JSON file
DATA_FILE = 'data/assignments.json'

# Pydantic models
class Assignment(BaseModel):
    title: str = Field(..., example="Math Assignment")
    subject: str = Field(..., example="Mathematics")
    dueDate: str = Field(..., example="2023-12-01")
    priority: int = Field(..., ge=1, le=5, example=3)

class AssignmentInDB(Assignment):
    id: int

class AssignmentsResponse(BaseModel):
    assignments: List[AssignmentInDB]

# Load assignments from JSON file
def load_assignments():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return json.load(file)

# Save assignments to JSON file
def save_assignments(assignments):
    with open(DATA_FILE, 'w') as file:
        json.dump(assignments, file)

@app.get("/assignments", response_model=AssignmentsResponse)
async def get_assignments():
    """Retrieve all assignments."""
    assignments = load_assignments()
    return AssignmentsResponse(assignments=assignments)

@app.post("/assignments", response_model=AssignmentInDB, status_code=201)
async def create_assignment(assignment: Assignment):
    """Create a new assignment."""
    assignments = load_assignments()
    new_id = len(assignments) + 1
    new_assignment = AssignmentInDB(id=new_id, **assignment.dict())
    assignments.append(new_assignment.dict())
    save_assignments(assignments)
    return new_assignment

@app.put("/assignments/{id}", response_model=AssignmentInDB)
async def update_assignment(id: int = Path(..., gt=0), assignment: Assignment):
    """Update an existing assignment by ID."""
    assignments = load_assignments()
    for idx, existing_assignment in enumerate(assignments):
        if existing_assignment['id'] == id:
            updated_assignment = AssignmentInDB(id=id, **assignment.dict())
            assignments[idx] = updated_assignment.dict()
            save_assignments(assignments)
            return updated_assignment
    raise HTTPException(status_code=404, detail="Assignment not found")

@app.delete("/assignments/{id}", status_code=204)
async def delete_assignment(id: int = Path(..., gt=0)):
    """Delete an assignment by ID."""
    assignments = load_assignments()
    for idx, existing_assignment in enumerate(assignments):
        if existing_assignment['id'] == id:
            del assignments[idx]
            save_assignments(assignments)
            return
    raise HTTPException(status_code=404, detail="Assignment not found")
