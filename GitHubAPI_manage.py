
import json
from pathlib import Path
import requests
OUTPUT_DIR = Path(__file__).resolve().parent / "data" / "raw"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

session = requests.Session()
session.headers.update({
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
})



def get_json(owner, repo, endpoint, params=None):
    url = f"https://api.github.com/repos/{owner}/{repo}/{endpoint}"

    try:
        response = session.get(
            url,
            params=params,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    except requests.RequestException as error:
        return {
            "error": "GitHub API request failed.",
            "details": str(error)
        }


def save_json(filename, data):
    path = OUTPUT_DIR / filename
    path.write_text(
        json.dumps(data, indent=2),
        encoding="utf-8",
    )
    print(f"Saved: {path}")

def remove_old_pr_files():
    for path in OUTPUT_DIR.glob("pr_*_files.json"):
        path.unlink()
        print(f"Removed old file: {path}")

# 1. Understand the repository's identity.

def ingest_repository(owner, repo):
    # 1. Retrieve repository metadata.
    repo_info = get_json(owner, repo, "")

    if "error" in repo_info:
        return repo_info

    save_json("repository.json", repo_info)

    print("Repository:", repo_info.get("full_name"))
    print("Description:", repo_info.get("description"))
    print("Default branch:", repo_info.get("default_branch"))

    # 2. Retrieve the README.
    readme = get_json(owner, repo, "readme")
    save_json("readme_metadata.json", readme)

    # 3. Retrieve the repository's file tree.
    branch = repo_info.get("default_branch")

    if branch:
        tree = get_json(
            owner,
            repo,
            f"git/trees/{branch}",
            {"recursive": "1"},
        )
        save_json("repository_tree.json", tree)

        print("Files listed:", len(tree.get("tree", [])))
        print("Tree truncated:", tree.get("truncated", False))

    # 4. Retrieve issues and exclude pull requests.
    issues = get_json(
        owner,
        repo,
        "issues",
        {"state": "all", "per_page": 10},
    )

    if isinstance(issues, list):
        issues_only = [
            item for item in issues
            if "pull_request" not in item
        ]
        save_json("issues.json", issues_only)
    else:
        return issues

    # 5. Retrieve pull requests.
    pulls = get_json(
        owner,
        repo,
        "pulls",
        {"state": "all", "per_page": 10},
    )

    if not isinstance(pulls, list):
        return pulls

    # Fetch changed files for the most recent returned PR.
    pr_files = None
    pr_filename = None

    if pulls:
        pr_number = pulls[0]["number"]
        pr_files = get_json(
            owner,
            repo,
            f"pulls/{pr_number}/files",
            {"per_page": 100},
        )

        if isinstance(pr_files, list):
            pr_filename = f"pr_{pr_number}_files.json"
        else:
            return pr_files

    # 6. Save the fetched PR data.
    remove_old_pr_files()
    save_json("pull_requests.json", pulls)

    if pr_files is not None:
        save_json(pr_filename, pr_files)
        print("Inspected PR:", pulls[0]["number"])
        print("Changed files:", len(pr_files))

    print("Initial ingestion completed.")

    return {
        "repository": repo_info.get("full_name"),
        "total_pull_requests": len(pulls),
        "pull_requests": pulls,
        "message": "Repository ingestion completed."
    }


if __name__ == "__main__":
    # Optional standalone test:
    # Replace these values with the repository you want to test.
    test_owner = "scikit-learn"
    test_repo = "scikit-learn"

    result = ingest_repository(test_owner, test_repo)
    print(result)
