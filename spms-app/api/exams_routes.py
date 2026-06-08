from fastapi import FastAPI, HTTPException, Path
from pydantic import BaseModel, Field
from typing import List
import json
import os

app = FastAPI()

# Define the path for the JSON file
DATA_FILE = 'data/exams.json'

# Pydantic models
class Exam(BaseModel):
    subject: str = Field(..., example="Physics")
    date: str = Field(..., example="2023-12-10")
    time: str = Field(..., example="10:00")
    location: str = Field(..., example="Room 101")

class ExamInDB(Exam):
    id: int

class ExamsResponse(BaseModel):
    exams: List[ExamInDB]

# Load exams from JSON file
def load_exams():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return json.load(file)

# Save exams to JSON file
def save_exams(exams):
    with open(DATA_FILE, 'w') as file:
        json.dump(exams, file)

@app.get("/exams", response_model=ExamsResponse)
async def get_exams():
    """Retrieve all exams."""
    exams = load_exams()
    return ExamsResponse(exams=exams)

@app.post("/exams", response_model=ExamInDB, status_code=201)
async def create_exam(exam: Exam):
    """Create a new exam."""
    exams = load_exams()
    new_id = len(exams) + 1
    new_exam = ExamInDB(id=new_id, **exam.dict())
    exams.append(new_exam.dict())
    save_exams(exams)
    return new_exam

@app.delete("/exams/{id}", status_code=204)
async def delete_exam(id: int = Path(..., gt=0)):
    """Delete an exam by ID."""
    exams = load_exams()
    for idx, existing_exam in enumerate(exams):
        if existing_exam['id'] == id:
            del exams[idx]
            save_exams(exams)
            return
    raise HTTPException(status_code=404, detail="Exam not found")
