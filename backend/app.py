import json
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

app = FastAPI()

# 1) CORS — allow everything (for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2) CSP middleware — allow images from self, data: URIs, and github.dev
@app.middleware("http")
async def csp_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' https://github.dev data:;"
    )
    return response

# 3) Path constants
BASE_DIR = os.path.dirname(__file__)
MODE1_JSON = os.path.join(BASE_DIR, "mode1.json")
MODE2_JSON = os.path.join(BASE_DIR, "mode2.json")
MODE3_JSON = os.path.join(BASE_DIR, "mode3.json")
MODE4_JSON = os.path.join(BASE_DIR, "mode4.json")

def load_json(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[load_json] File not found: {path}")
    except json.JSONDecodeError as e:
        print(f"[load_json] Invalid JSON in {path}: {e}")
    return None

@app.get("/mode1/data")
async def mode1_data():
    data = load_json(MODE1_JSON)
    if data is None:
        raise HTTPException(status_code=404, detail="mode1.json not found or invalid")
    return data

@app.get("/mode2/data")
async def mode2_data():
    data = load_json(MODE2_JSON)
    if data is None:
        raise HTTPException(status_code=404, detail="mode2.json not found or invalid")
    return data

@app.get("/mode3/data")
async def mode3_data():
    data = load_json(MODE3_JSON)
    if data is None:
        raise HTTPException(status_code=404, detail="mode3.json not found or invalid")
    # optional: warn if keys missing
    for key in ("drift_state", "metrics", "confusion_matrices"):
        if key not in data:
            print(f"[mode3_data] Warning: missing key '{key}'")
    return data

@app.get("/mode4/data")
async def mode4_data():
    data = load_json(MODE4_JSON)
    if data is None:
        # now returns 404 if the file is absent
        raise HTTPException(status_code=404, detail="mode4.json not found or invalid")
    return data

# serve favicon so the browser stops proxying it through the GH tunnel
@app.get("/favicon.ico")
async def favicon():
    path = os.path.join(BASE_DIR, "static", "favicon.ico")
    if os.path.isfile(path):
        return FileResponse(path, media_type="image/vnd.microsoft.icon")
    # no content if you don't have one
    return JSONResponse(status_code=204, content=None)

@app.get("/")
async def read_root():
    return {
        "message": "Welcome to the backend API!",
        "endpoints": [
            "/mode1/data",
            "/mode2/data",
            "/mode3/data",
            "/mode4/data",
            "/mode-selection-data"
        ],
    }

MODE_SELECTION_JSON = os.path.join(BASE_DIR, "modeSelectionData.json")

@app.get("/mode-selection-data")
async def mode_selection_data():
    data = load_json(MODE_SELECTION_JSON)
    if data is None:
        raise HTTPException(status_code=404, detail="modeSelectionData.json not found or invalid")
    return data
ENT_SELECTION_JSON = os.path.join(BASE_DIR, "entries_table.json")

@app.get("/entries-table")
async def mode_selection_data():
    data = load_json(ENT_SELECTION_JSON)
    if data is None:
        raise HTTPException(status_code=404, detail="entries_table.json not found or invalid")
    return data
