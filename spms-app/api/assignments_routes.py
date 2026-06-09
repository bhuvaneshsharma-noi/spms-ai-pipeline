from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

app = FastAPI()

DATA_FILE = '/home/noi-26/crewTest/spms-ai-pipeline/spms-app/api/data/assignments.json'

class Assignment(BaseModel):
    id: Optional[int] = Field(default=None, description="The unique identifier for the assignment")
    title: str = Field(..., description="The title of the assignment")
    subject: str = Field(..., description="The subject of the assignment")
    dueDate: str = Field(..., description="The due date of the assignment in YYYY-MM-DD format")
    priority: str = Field(..., description="The priority of the assignment")

class AssignmentResponse(BaseModel):
    message: str
    assignment: Assignment

@app.get('/assignments', response_model=List[Assignment])
async def get_assignments():
    try:
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r') as file:
            assignments = json.load(file)
        return assignments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/assignments', response_model=AssignmentResponse, status_code=201)
async def create_assignment(assignment: Assignment):
    try:
        if not os.path.exists(DATA_FILE):
            assignments = []
        else:
            with open(DATA_FILE, 'r') as file:
                assignments = json.load(file)

        assignment.id = len(assignments) + 1
        assignments.append(assignment.dict())

        with open(DATA_FILE, 'w') as file:
            json.dump(assignments, file)

        return AssignmentResponse(message="Assignment created successfully", assignment=assignment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put('/assignments/{id}', response_model=AssignmentResponse)
async def update_assignment(id: int = Path(..., description="The ID of the assignment to update"), assignment: Assignment):
    try:
        with open(DATA_FILE, 'r') as file:
            assignments = json.load(file)

        for idx, existing_assignment in enumerate(assignments):
            if existing_assignment['id'] == id:
                assignments[idx] = assignment.dict()
                assignments[idx]['id'] = id
                with open(DATA_FILE, 'w') as file:
                    json.dump(assignments, file)
                return AssignmentResponse(message="Assignment updated successfully", assignment=assignment)

        raise HTTPException(status_code=404, detail="Assignment not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete('/assignments/{id}', status_code=204)
async def delete_assignment(id: int = Path(..., description="The ID of the assignment to delete")):
    try:
        with open(DATA_FILE, 'r') as file:
            assignments = json.load(file)

        assignments = [assignment for assignment in assignments if assignment['id'] != id]

        with open(DATA_FILE, 'w') as file:
            json.dump(assignments, file)

        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
