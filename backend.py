
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
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

@app.post("/analyze")
def analyze_repo(data: RepoRequest):
    repo_url = data.repo_url.rstrip("/")

    # Extract owner and repository name
    parts = repo_url.removesuffix(".git").split("/")
    owner = parts[-2]
    repo = parts[-1]

    # Request pull requests from GitHub
    api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls"

    response = requests.get(
        api_url,
        params={"state": "all", "per_page": 100},
        headers={"Accept": "application/vnd.github+json"},
        timeout=15
    )

    if response.status_code != 200:
        return {
            "error": "Could not fetch pull requests",
            "status_code": response.status_code
        }

    pull_requests = response.json()

    # Keep only useful fields for PRISM
    results = [
        {
            "number": pr["number"],
            "title": pr["title"],
            "author": pr["user"]["login"],
            "state": pr["state"],
            "additions": pr["additions"],
            "deletions": pr["deletions"],
            "url": pr["html_url"]
        }
        for pr in pull_requests
    ]

    return {
        "repository": f"{owner}/{repo}",
        "total_pull_requests": len(results),
        "pull_requests": results
    }
