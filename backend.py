
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="PRISM Backend")

# Allow requests from your React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    repo_url: str

@app.get("/")
def home():
    return {"message": "PRISM backend is running"}

@app.post("/analyze")
def analyze_repo(data: RepoRequest):
    # Connection test only — add GitHub analysis later
    return {
        "message": "Repository received successfully!",
        "repo_url": data.repo_url
    }
