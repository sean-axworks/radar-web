import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "sync_notices.py"


class WebSyncTest(unittest.TestCase):
    def git(self, root, *args):
        return subprocess.check_output(["git", "-C", str(root), *args], stderr=subprocess.STDOUT, text=True)

    def setUp(self):
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.remote = self.root / "remote.git"
        self.site = self.root / "site"
        self.site.mkdir()
        self.git(self.root, "init", "--bare", str(self.remote))
        self.git(self.site, "init", "-b", "main")
        self.git(self.site, "config", "user.name", "Radar test")
        self.git(self.site, "config", "user.email", "radar@example.test")
        self.git(self.site, "remote", "add", "origin", str(self.remote))
        (self.site / "data").mkdir()
        self.data = self.site / "data" / "grants.json"
        self.data.write_text('[{"id": "example"}]\n', encoding="utf-8")
        self.git(self.site, "add", "data")
        self.git(self.site, "commit", "-m", "Fixture")
        self.git(self.site, "push", "-u", "origin", "main")
        self.row = {"id": "iris-42", "title": "실증 지원", "agency": "IRIS",
                    "category": "R&D", "deadline": None, "budget_text": "원문 확인",
                    "max_grant_amount": None, "gov_ratio": None, "cash_ratio": None,
                    "summary_3lines": ["첫째", "둘째", "셋째"],
                    "source_url": "https://example.org/42", "created_at": "2026-11-14"}

    def sync(self, rows):
        result = subprocess.run([sys.executable, str(SCRIPT), "grants"], cwd=self.site,
                                input=json.dumps(rows), capture_output=True, text=True, check=True)
        return json.loads(result.stdout)

    def test_prepends_once_and_preserves_existing_rows(self):
        self.assertEqual(self.sync([self.row, self.row])["pushed"], 1)
        self.assertEqual(self.sync([self.row])["pushed"], 0)
        self.assertEqual(json.loads(self.data.read_text(encoding="utf-8")), [self.row, {"id": "example"}])
        self.assertEqual(self.git(self.site, "log", "-1", "--format=%s").strip(), "chore: daily radar update")
        self.assertEqual(self.git(self.site, "rev-parse", "HEAD"), self.git(self.remote, "rev-parse", "main"))

    def test_failed_push_leaves_commit_to_retry_without_recollecting(self):
        self.git(self.site, "remote", "set-url", "--push", "origin", str(self.root / "unavailable"))
        self.assertEqual(self.sync([self.row])["status"], "pending")
        self.git(self.site, "remote", "set-url", "--push", "origin", str(self.remote))
        self.assertEqual(self.sync([])["pushed"], 1)
        self.assertEqual(self.git(self.site, "rev-parse", "HEAD"), self.git(self.remote, "rev-parse", "main"))

    def test_unrelated_pending_commit_is_not_published_and_batch_is_retried(self):
        (self.site / "private.txt").write_text("fixture", encoding="utf-8")
        self.git(self.site, "add", "private.txt")
        self.git(self.site, "commit", "-m", "Unrelated local work")
        self.assertEqual(self.sync([self.row])["status"], "pending")
        self.assertEqual(json.loads(self.data.read_text()), [{"id": "example"}])
        self.assertEqual(self.git(self.remote, "log", "main", "-1", "--format=%s").strip(), "Fixture")
        # Return the disposable fixture to its upstream tip.
        self.git(self.site, "reset", "--hard", "origin/main")
        self.assertEqual(self.sync([])["pushed"], 1)
