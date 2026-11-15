"""Update the shared radar-web checkout from a bot's JSON batch on stdin."""

import json
import math
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
from contextlib import closing
from pathlib import Path

MESSAGE = "chore: daily radar update"
DATASETS = ("grants", "bids")
DATA_PATHS = {f"data/{kind}.json" for kind in DATASETS}


def git(*args):
    env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "Never"}
    result = subprocess.run(["git", *args], capture_output=True, encoding="utf-8",
                            errors="replace", env=env, timeout=30, check=False)
    if result.returncode:
        raise RuntimeError(f"git {args[0]} exit {result.returncode}")
    return result.stdout.strip()


def read_rows(text):
    rows = json.loads(text)
    if not isinstance(rows, list) or any(
        not isinstance(row, dict) or not isinstance(row.get("id"), str) for row in rows
    ):
        raise ValueError("Invalid notice JSON")
    return rows


def valid_notice(row):
    text_fields = ("title", "agency", "category", "budget_text", "source_url", "created_at")
    if any(not isinstance(row.get(key), str) or not row[key].strip() for key in text_fields):
        return False
    if "deadline" not in row or (row["deadline"] is not None and not isinstance(row["deadline"], str)):
        return False
    summary = row.get("summary_3lines")
    if not isinstance(summary, list) or len(summary) != 3 or any(
        not isinstance(line, str) or not line.strip() for line in summary
    ):
        return False
    if "max_grant_amount" not in row:
        return False
    amount = row["max_grant_amount"]
    if amount is not None and (type(amount) is not int or not 0 <= amount < 2**53):
        return False
    return all(
        key in row and (row[key] is None or (
            type(row[key]) in (int, float) and 0 <= row[key] <= 1 and math.isfinite(row[key])
        ))
        for key in ("gov_ratio", "cash_ratio")
    )


def atomic_write(path, content):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        temporary = Path(handle.name)
    try:
        temporary.write_bytes(content)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def merge_rows(existing, incoming):
    seen = {row["id"] for row in existing}
    added = []
    for row in incoming:
        if row["id"] in seen:
            continue
        seen.add(row["id"])
        added.append(row)
    return added + existing


def update_checkout(connection, kind, upstream):
    if git("branch", "--show-current") != "main" or git("rev-parse", "--show-prefix"):
        raise ValueError("Expected radar-web root on main")
    path = Path("data") / f"{kind}.json"
    if git("status", "--porcelain", "--", path.as_posix()):
        raise ValueError(f"Local changes to {path.as_posix()} need review")
    upstream_head = git("rev-parse", upstream)
    local_head = git("rev-parse", "HEAD")
    ahead = git("rev-list", "--reverse", f"{upstream}..HEAD").splitlines()
    for commit in ahead:
        paths = git("diff-tree", "--no-commit-id", "--name-only", "-r", commit).splitlines()
        if (git("show", "-s", "--format=%s", commit) != MESSAGE or not paths
                or not set(paths) <= DATA_PATHS):
            raise ValueError("Unrelated local commits need review")
    if not ahead and local_head != upstream_head:
        git("merge", "--ff-only", upstream)
    elif ahead and git("merge-base", upstream, "HEAD") != upstream_head:
        raise ValueError("Local updates diverged from origin/main")
    pending = [json.loads(row[0]) for row in connection.execute(
        "SELECT payload FROM queue WHERE kind = ? ORDER BY rowid DESC", (kind,)
    )]
    original = path.read_bytes()
    existing = read_rows(original.decode("utf-8"))
    combined = merge_rows(existing, pending)
    if combined != existing:
        content = (json.dumps(combined, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
        atomic_write(path, content)
        try:
            git("add", "--", path.as_posix())
            git("commit", "-m", MESSAGE, "--", path.as_posix())
        except (RuntimeError, OSError):
            if path.read_bytes() == content:
                atomic_write(path, original)
                git("reset", "--", path.as_posix())
            raise
    if git("rev-parse", "HEAD") != git("rev-parse", upstream):
        git("push", "origin", "HEAD:refs/heads/main")


def sync(kind, rows):
    if any(not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,160}", row["id"]) or not valid_notice(row) for row in rows):
        raise ValueError("Invalid notice data")
    git_dir = Path(git("rev-parse", "--absolute-git-dir"))
    queue = git_dir / "radar-notices.sqlite3"
    with closing(sqlite3.connect(queue, timeout=65)) as connection:
        with connection:
            connection.execute("""CREATE TABLE IF NOT EXISTS queue (
                kind TEXT, id TEXT, payload TEXT, PRIMARY KEY (kind, id))""")
            connection.executemany("INSERT OR IGNORE INTO queue VALUES (?, ?, ?)", [
                (kind, row["id"], json.dumps(row, ensure_ascii=False)) for row in rows
            ])
        # Hold a shared cross-process writer lock through JSON, commit and push.
        connection.execute("BEGIN IMMEDIATE")
        try:
            pending = {row[0] for row in connection.execute("SELECT id FROM queue WHERE kind = ?", (kind,))}
            if not pending:
                connection.commit()
                return {"pushed": 0, "status": "ok"}
            upstream = git("rev-parse", "--abbrev-ref", "@{upstream}")
            if upstream != "origin/main":
                raise ValueError("Expected origin/main upstream")
            git("fetch", "origin", "main")
            before = {row["id"]: row for row in read_rows(git("show", f"{upstream}:data/{kind}.json"))}
            update_checkout(connection, kind, upstream)
            after = {row["id"]: row for row in read_rows(Path(f"data/{kind}.json").read_text(encoding="utf-8"))}
            pushed = sum(before.get(key) != after[key] for key in pending & after.keys())
            connection.execute("DELETE FROM queue WHERE kind = ?", (kind,))
            connection.commit()
            return {"pushed": pushed, "status": "ok"}
        except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
            connection.rollback()
            print(f"Web sync pending ({error})", file=sys.stderr)
            return {"pushed": 0, "status": "pending"}


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in DATASETS:
        sys.exit("Usage: sync_notices.py grants|bids")
    try:
        print(json.dumps(sync(sys.argv[1], read_rows(sys.stdin.read()))))
    except (OSError, ValueError, RuntimeError, sqlite3.Error, subprocess.TimeoutExpired) as error:
        print(f"Web sync failed ({type(error).__name__})", file=sys.stderr)
        print(json.dumps({"pushed": 0, "status": "failed"}))
