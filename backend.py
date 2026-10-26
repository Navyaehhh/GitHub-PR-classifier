from urllib.parse import urlparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import GitHubAPI_manage
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
    repo_url = data.repo_url.strip()
    parsed = urlparse(repo_url)

    # Validate the GitHub repository URL
    if parsed.hostname not in {"github.com", "www.github.com"}:
        return {"error": "Please provide a valid GitHub repository URL."}

    parts = parsed.path.strip("/").split("/")

    if len(parts) != 2 or not all(parts):
        return {
            "error": "URL must contain both owner and repository name."
        }

    owner = parts[0]
    repo = parts[1].removesuffix(".git")

    # Fetch pull requests from GitHub
    result = GitHubAPI_manage.ingest_repository(owner, repo)
    return result

    try:
        response = requests.get(
            api_url,
            params={"state": "all", "per_page": 100},
            headers={"Accept": "application/vnd.github+json"},
            timeout=15
        )
    except requests.RequestException:
        return {"error": "Could not connect to GitHub."}

    if response.status_code != 200:
        return {
            "error": "Could not fetch pull requests",
            "status_code": response.status_code
        }

    pull_requests = response.json()

    results = [
        {
            "number": pr["number"],
            "title": pr["title"],
            "author": pr["user"]["login"],
            "state": pr["state"],
            "url": pr["html_url"]
        }
        for pr in pull_requests
    ]

    return {
        "repository": f"{owner}/{repo}",
        "total_pull_requests": len(results),
        "pull_requests": results
    }
