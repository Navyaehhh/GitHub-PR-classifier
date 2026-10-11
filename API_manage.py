
import json
from pathlib import Path

import requests

OWNER = "scikit-learn"
REPO = "scikit-learn"

BASE_URL = f"https://api.github.com/repos/{OWNER}/{REPO}"
OUTPUT_DIR = Path("data/raw")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

session = requests.Session()
session.headers.update({
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
})



def get_json(endpoint, params=None):
    url = f"{BASE_URL}/{endpoint}".rstrip("/")

    response = session.get(
        url,
        params=params,
        timeout=30,
    )

    if response.status_code == 404:
        raise RuntimeError(
            f"GitHub returned 404 for {url}.\n"
            "Check the repository owner/name, "
            "visibility, and authentication permissions."
        )
    response.raise_for_status()
    return response.json()


def save_json(filename, data):
    """Save raw GitHub data for later processing."""
    path = OUTPUT_DIR / filename
    path.write_text(
        json.dumps(data, indent=2),
        encoding="utf-8",
    )
    print(f"Saved: {path}")


# 1. Understand the repository's identity.
repo_info = get_json("")
save_json("repository.json", repo_info)

print("Repository:", repo_info["full_name"])
print("Description:", repo_info["description"])
print("Default branch:", repo_info["default_branch"])


# 2. Retrieve the README.
readme = get_json("readme")
save_json("readme_metadata.json", readme)


# 3. Retrieve the repository's file tree.
branch = repo_info["default_branch"]
tree = get_json(f"git/trees/{branch}", {"recursive": "1"})
save_json("repository_tree.json", tree)

print("Files listed:", len(tree.get("tree", [])))
print("Tree truncated:", tree.get("truncated", False))


# 4. Retrieve issues and exclude PR records.
issues = get_json(
    "issues",
    {"state": "all", "per_page": 10},
)
issues_only = [
    item for item in issues
    if "pull_request" not in item
]
save_json("issues.json", issues_only)


# 5. Retrieve pull request metadata.
pulls = get_json(
    "pulls",
    {"state": "all", "per_page": 10},
)
save_json("pull_requests.json", pulls)


# 6. Retrieve changed files for one PR.
if pulls:
    pr_number = pulls[0]["number"]
    files = get_json(
        f"pulls/{pr_number}/files",
        {"per_page": 100},
    )
    save_json(f"pr_{pr_number}_files.json", files)

    print("Inspected PR:", pr_number)
    print("Changed files:", len(files))

print("Initial ingestion completed.")
