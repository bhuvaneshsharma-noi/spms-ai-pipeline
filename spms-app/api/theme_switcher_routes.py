from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, constr
import json
import os

app = FastAPI()

DATA_FILE = '/home/noi-26/crewTest/spms-ai-pipeline/spms-app/api/data/themes.json'

class Theme(BaseModel):
    name: constr(min_length=1)
    color: constr(min_length=1)

class ThemeSwitcherResponse(BaseModel):
    message: str
    current_theme: Theme

@app.get('/themes', response_model=list[Theme], status_code=200)
async def get_themes():
    """Retrieve available themes."""
    try:
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r') as file:
            themes = json.load(file)
            return themes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/themes/switch', response_model=ThemeSwitcherResponse, status_code=201)
async def switch_theme(theme: Theme):
    """Switch to a specified theme."""
    try:
        with open(DATA_FILE, 'r') as file:
            themes = json.load(file)
        if theme.name not in [t['name'] for t in themes]:
            raise HTTPException(status_code=404, detail='Theme not found')
        # Here you would implement the logic to switch the theme in your application
        return ThemeSwitcherResponse(message='Theme switched successfully', current_theme=theme)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail='Invalid JSON format')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/themes/{theme_name}', response_model=Theme, status_code=200)
async def get_theme(theme_name: str):
    """Retrieve a specific theme by name."""
    try:
        with open(DATA_FILE, 'r') as file:
            themes = json.load(file)
        theme = next((t for t in themes if t['name'] == theme_name), None)
        if theme is None:
            raise HTTPException(status_code=404, detail='Theme not found')
        return theme
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
