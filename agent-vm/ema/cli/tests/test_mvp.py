"""
MVP smoke tests for EMA CLI HTTP commands.
Mocks urllib.request to avoid needing a live daemon.
Tests: task, project, proposal, status commands.
"""
import os
import sys
import json
import unittest
import io
import tempfile
from unittest.mock import patch, MagicMock, Mock

# Setup path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Point store to temp file
TEST_STORE = tempfile.mktemp(suffix=".mvp_test.json")
os.environ["EMA_STORE"] = TEST_STORE
os.environ["EMA_HOST"] = "localhost:4488"

from ema_cli.cli_args import parse_args
from ema_cli import config


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_response(body, status=200):
    """Create a mock urllib response object."""
    mock_resp = MagicMock()
    mock_resp.status = status
    mock_resp.read.return_value = json.dumps(body).encode("utf-8")
    mock_resp.__enter__ = lambda s: s
    mock_resp.__exit__ = MagicMock(return_value=False)
    return mock_resp


def _run_cmd(argv, response_body=None, response_status=200):
    """
    Run a CLI command with mocked HTTP and return (exit_code, stdout, stderr).
    """
    from ema_cli.main import main

    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()

    if response_body is None:
        response_body = {}

    mock_resp = _make_response(response_body, response_status)

    with patch("urllib.request.urlopen", return_value=mock_resp):
        with patch("sys.stdout", stdout_capture):
            with patch("sys.stderr", stderr_capture):
                try:
                    rc = main(argv)
                except SystemExit as e:
                    rc = e.code

    return rc or 0, stdout_capture.getvalue(), stderr_capture.getvalue()


def _run_cmd_error(argv, exception):
    """Run command where urllib raises an exception."""
    from ema_cli.main import main

    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()

    with patch("urllib.request.urlopen", side_effect=exception):
        with patch("sys.stdout", stdout_capture):
            with patch("sys.stderr", stderr_capture):
                rc = main(argv)

    return rc or 0, stdout_capture.getvalue(), stderr_capture.getvalue()


# ---------------------------------------------------------------------------
# Test: ema status
# ---------------------------------------------------------------------------

class TestStatusCommand(unittest.TestCase):

    def test_status_daemon_up(self):
        data = {
            "status": "ok",
            "subsystems": {
                "openclaw": {"ok": True, "message": "connected"},
                "superman": {"ok": False, "message": "indexing offline"},
            },
            "counts": {
                "running_agents": 2,
                "pending_tasks": 7,
                "open_proposals": 3,
                "active_projects": 5,
            }
        }
        rc, out, err = _run_cmd(["status"], response_body=data)
        self.assertEqual(rc, 0)
        # Status box should appear in stdout
        self.assertIn("EMA Status", out)
        self.assertIn("localhost:4488", out)

    def test_status_daemon_up_json(self):
        data = {"status": "ok"}
        rc, out, err = _run_cmd(["status", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("daemon", parsed)
        self.assertTrue(parsed["daemon"]["reachable"])

    def test_status_daemon_down(self):
        """When daemon is unreachable, exit code should be 2."""
        from ema_cli.client import DaemonError
        # DaemonError is raised when connection fails
        from urllib.error import URLError
        rc, out, err = _run_cmd_error(["status"], ConnectionRefusedError("Connection refused"))
        self.assertEqual(rc, 2)
        # Error message in output
        self.assertTrue(
            "Cannot reach" in out or "Cannot reach" in err,
            f"Expected error message. stdout={out!r}, stderr={err!r}"
        )

    def test_status_daemon_down_json(self):
        """JSON output when daemon is down."""
        rc, out, err = _run_cmd_error(["status", "--json"], ConnectionRefusedError())
        # Exit code 2
        self.assertEqual(rc, 2)
        # Should output valid JSON
        parsed = json.loads(out)
        self.assertFalse(parsed["daemon"]["reachable"])


# ---------------------------------------------------------------------------
# Test: ema task
# ---------------------------------------------------------------------------

class TestTaskCommand(unittest.TestCase):

    SAMPLE_TASKS = [
        {"id": "tsk_abc12345", "title": "Fix login bug", "status": "pending",
         "priority": 2, "due_date": None, "agent": None},
        {"id": "tsk_def67890", "title": "Write tests", "status": "in_progress",
         "priority": 3, "due_date": "2026-04-10", "agent": "coder"},
    ]

    def test_task_list_human(self):
        data = {"tasks": self.SAMPLE_TASKS}
        rc, out, err = _run_cmd(["task", "list"], response_body=data)
        self.assertEqual(rc, 0)
        self.assertIn("Fix login bug", out)
        self.assertIn("Write tests", out)

    def test_task_list_json(self):
        data = {"tasks": self.SAMPLE_TASKS}
        rc, out, err = _run_cmd(["task", "list", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("tasks", parsed)
        self.assertEqual(len(parsed["tasks"]), 2)

    def test_task_list_json_shortflag(self):
        data = {"tasks": self.SAMPLE_TASKS}
        rc, out, err = _run_cmd(["task", "list", "-j"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("tasks", parsed)

    def test_task_list_empty(self):
        rc, out, err = _run_cmd(["task", "list"], response_body={"tasks": []})
        self.assertEqual(rc, 0)

    def test_task_list_daemon_down(self):
        rc, out, err = _run_cmd_error(["task", "list"], ConnectionRefusedError())
        self.assertEqual(rc, 2)

    def test_task_create_human(self):
        created = {"task": {"id": "tsk_new12345", "title": "New task", "status": "pending"}}
        rc, out, err = _run_cmd(["task", "create", "New task"], response_body=created, response_status=201)
        self.assertEqual(rc, 0)
        # Created message in stderr
        self.assertIn("tsk_new12345", err)

    def test_task_create_json(self):
        created = {"task": {"id": "tsk_new12345", "title": "New task"}}
        rc, out, err = _run_cmd(
            ["task", "create", "New task", "--json"],
            response_body=created, response_status=201
        )
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("task", parsed)

    def test_task_create_no_title(self):
        rc, out, err = _run_cmd(["task", "create"])
        self.assertEqual(rc, 1)

    def test_task_create_with_options(self):
        created = {"task": {"id": "tsk_xyz99999", "title": "Refactor auth"}}
        rc, out, err = _run_cmd(
            ["task", "create", "Refactor auth", "--project", "proslync", "--priority", "2"],
            response_body=created, response_status=201
        )
        self.assertEqual(rc, 0)

    def test_task_show_human(self):
        data = {"task": {
            "id": "tsk_abc12345", "title": "Fix login bug",
            "status": "pending", "priority": 2,
            "description": "The login form breaks on mobile",
        }}
        rc, out, err = _run_cmd(["task", "show", "tsk_abc12345"], response_body=data)
        self.assertEqual(rc, 0)
        self.assertIn("Fix login bug", out)

    def test_task_show_json(self):
        data = {"task": {"id": "tsk_abc12345", "title": "Fix login"}}
        rc, out, err = _run_cmd(["task", "show", "tsk_abc12345", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("task", parsed)

    def test_task_show_not_found(self):
        data = {"error": "not_found", "message": "Task not found"}
        rc, out, err = _run_cmd(["task", "show", "tsk_nonexist"], response_body=data, response_status=404)
        self.assertEqual(rc, 1)
        self.assertIn("not found", err.lower())

    def test_task_show_missing_id(self):
        rc, out, err = _run_cmd(["task", "show"])
        self.assertEqual(rc, 1)

    def test_task_update_human(self):
        data = {"task": {"id": "tsk_abc12345", "title": "Fix login", "status": "done"}}
        rc, out, err = _run_cmd(
            ["task", "update", "tsk_abc12345", "--status", "done"],
            response_body=data
        )
        self.assertEqual(rc, 0)

    def test_task_update_no_fields(self):
        rc, out, err = _run_cmd(["task", "update", "tsk_abc12345"])
        self.assertEqual(rc, 1)

    def test_task_update_json(self):
        data = {"task": {"id": "tsk_abc12345", "status": "done"}}
        rc, out, err = _run_cmd(
            ["task", "update", "tsk_abc12345", "--status", "done", "--json"],
            response_body=data
        )
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("task", parsed)

    def test_task_no_subcommand_shows_help(self):
        rc, out, err = _run_cmd(["task"])
        self.assertEqual(rc, 0)
        self.assertIn("ema task", out)

    def test_task_unknown_subcommand(self):
        rc, out, err = _run_cmd(["task", "explode"])
        self.assertEqual(rc, 1)


# ---------------------------------------------------------------------------
# Test: ema project
# ---------------------------------------------------------------------------

class TestProjectCommand(unittest.TestCase):

    SAMPLE_PROJECTS = [
        {"id": "pro_abc12345", "name": "StudioKamel", "slug": "studiokamel",
         "status": "active", "linked_path": "~/Projects/studiokamel"},
        {"id": "pro_def67890", "name": "ProSlync", "slug": "proslync",
         "status": "active", "linked_path": "~/Projects/proslync"},
    ]

    def test_project_list_human(self):
        data = {"projects": self.SAMPLE_PROJECTS}
        rc, out, err = _run_cmd(["project", "list"], response_body=data)
        self.assertEqual(rc, 0)
        self.assertIn("StudioKamel", out)
        self.assertIn("ProSlync", out)

    def test_project_list_json(self):
        data = {"projects": self.SAMPLE_PROJECTS}
        rc, out, err = _run_cmd(["project", "list", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("projects", parsed)
        self.assertEqual(len(parsed["projects"]), 2)

    def test_project_list_empty(self):
        rc, out, err = _run_cmd(["project", "list"], response_body={"projects": []})
        self.assertEqual(rc, 0)

    def test_project_list_daemon_down(self):
        rc, out, err = _run_cmd_error(["project", "list"], ConnectionRefusedError())
        self.assertEqual(rc, 2)

    def test_project_show_human(self):
        data = {"project": {
            "id": "pro_abc12345", "name": "StudioKamel", "slug": "studiokamel",
            "status": "active", "description": "Main client project",
        }}
        rc, out, err = _run_cmd(["project", "show", "studiokamel"], response_body=data)
        self.assertEqual(rc, 0)
        self.assertIn("StudioKamel", out)

    def test_project_show_json(self):
        data = {"project": {"id": "pro_abc12345", "name": "StudioKamel"}}
        rc, out, err = _run_cmd(["project", "show", "pro_abc12345", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("project", parsed)

    def test_project_show_not_found(self):
        data = {"error": "not_found", "message": "Project not found"}
        rc, out, err = _run_cmd(["project", "show", "nonexist"], response_body=data, response_status=404)
        self.assertEqual(rc, 1)

    def test_project_show_missing_id(self):
        rc, out, err = _run_cmd(["project", "show"])
        self.assertEqual(rc, 1)

    def test_project_no_subcommand_shows_help(self):
        rc, out, err = _run_cmd(["project"])
        self.assertEqual(rc, 0)
        self.assertIn("ema project", out)

    def test_project_unknown_subcommand(self):
        rc, out, err = _run_cmd(["project", "explode"])
        self.assertEqual(rc, 1)


# ---------------------------------------------------------------------------
# Test: ema proposal
# ---------------------------------------------------------------------------

class TestProposalCommand(unittest.TestCase):

    SAMPLE_PROPOSALS = [
        {"id": "prp_abc12345", "title": "Migrate to new auth", "status": "pending",
         "confidence": 0.87, "project_id": "proslync", "inserted_at": "2026-04-03T10:00:00Z"},
        {"id": "prp_def67890", "title": "Add dark mode", "status": "queued",
         "confidence": 0.72, "project_id": "ema", "inserted_at": "2026-04-03T08:00:00Z"},
    ]

    def test_proposal_list_human(self):
        data = {"proposals": self.SAMPLE_PROPOSALS}
        rc, out, err = _run_cmd(["proposal", "list"], response_body=data)
        self.assertEqual(rc, 0)
        self.assertIn("Migrate to new auth", out)
        self.assertIn("Add dark mode", out)

    def test_proposal_list_json(self):
        data = {"proposals": self.SAMPLE_PROPOSALS}
        rc, out, err = _run_cmd(["proposal", "list", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("proposals", parsed)
        self.assertEqual(len(parsed["proposals"]), 2)

    def test_proposal_list_empty(self):
        rc, out, err = _run_cmd(["proposal", "list"], response_body={"proposals": []})
        self.assertEqual(rc, 0)

    def test_proposal_list_daemon_down(self):
        rc, out, err = _run_cmd_error(["proposal", "list"], ConnectionRefusedError())
        self.assertEqual(rc, 2)

    def test_proposal_list_with_filter(self):
        data = {"proposals": [self.SAMPLE_PROPOSALS[0]]}
        rc, out, err = _run_cmd(["proposal", "list", "--status", "pending"], response_body=data)
        self.assertEqual(rc, 0)

    def test_proposal_show_human(self):
        data = {"proposal": {
            "id": "prp_abc12345", "title": "Migrate to new auth",
            "status": "pending", "confidence": 0.87,
            "description": "Full auth module migration",
            "tags": ["auth", "backend"],
            "risks": ["Breaking changes"],
            "benefits": ["Better security"],
        }}
        rc, out, err = _run_cmd(["proposal", "show", "prp_abc12345"], response_body=data)
        self.assertEqual(rc, 0)
        self.assertIn("Migrate to new auth", out)

    def test_proposal_show_json(self):
        data = {"proposal": {"id": "prp_abc12345", "title": "Migrate"}}
        rc, out, err = _run_cmd(["proposal", "show", "prp_abc12345", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("proposal", parsed)

    def test_proposal_show_not_found(self):
        data = {"error": "not_found", "message": "Proposal not found"}
        rc, out, err = _run_cmd(["proposal", "show", "prp_nonexist"], response_body=data, response_status=404)
        self.assertEqual(rc, 1)

    def test_proposal_show_missing_id(self):
        rc, out, err = _run_cmd(["proposal", "show"])
        self.assertEqual(rc, 1)

    def test_proposal_no_subcommand_shows_help(self):
        rc, out, err = _run_cmd(["proposal"])
        self.assertEqual(rc, 0)
        self.assertIn("ema proposal", out)

    def test_proposal_unknown_subcommand(self):
        rc, out, err = _run_cmd(["proposal", "explode"])
        self.assertEqual(rc, 1)


# ---------------------------------------------------------------------------
# Test: global flags
# ---------------------------------------------------------------------------

class TestGlobalFlags(unittest.TestCase):

    def test_help(self):
        rc, out, err = _run_cmd(["--help"])
        self.assertEqual(rc, 0)
        self.assertIn("ema", out.lower())

    def test_help_no_args(self):
        rc, out, err = _run_cmd([])
        self.assertEqual(rc, 0)

    def test_version(self):
        rc, out, err = _run_cmd(["version"])
        self.assertEqual(rc, 0)
        self.assertIn("ema", out)

    def test_unknown_command(self):
        rc, out, err = _run_cmd(["totally-unknown-command"])
        self.assertEqual(rc, 1)

    def test_json_flag_short(self):
        data = {"tasks": [{"id": "tsk_x", "title": "T", "status": "pending"}]}
        rc, out, err = _run_cmd(["task", "list", "-j"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertIn("tasks", parsed)

    def test_host_override(self):
        """--host flag should be respected."""
        data = {"status": "ok"}
        # Mock to check URL contains the overridden host
        mock_resp = _make_response(data, 200)
        captured_urls = []

        def mock_urlopen(req, timeout=None):
            captured_urls.append(req.full_url)
            return mock_resp

        from ema_cli.main import main
        with patch("urllib.request.urlopen", side_effect=mock_urlopen):
            with patch("sys.stdout", io.StringIO()):
                with patch("sys.stderr", io.StringIO()):
                    main(["status", "--host", "myhost:9999"])

        # Check the URL used the overridden host
        self.assertTrue(any("myhost:9999" in url for url in captured_urls),
                        f"Expected myhost:9999 in URLs: {captured_urls}")


# ---------------------------------------------------------------------------
# Test: config command
# ---------------------------------------------------------------------------

class TestConfigCommand(unittest.TestCase):

    def test_config_show(self):
        rc, out, err = _run_cmd(["config"])
        self.assertEqual(rc, 0)
        self.assertIn("host", out)

    def test_config_path(self):
        rc, out, err = _run_cmd(["config", "path"])
        self.assertEqual(rc, 0)
        self.assertIn("cli.json", out)


# ---------------------------------------------------------------------------
# Test: CLI argument parsing
# ---------------------------------------------------------------------------

class TestArgParsing(unittest.TestCase):

    def test_positional(self):
        args = parse_args(["task", "list"])
        self.assertEqual(args.pos, ["task", "list"])

    def test_long_flag_equals(self):
        args = parse_args(["--status=pending", "--limit=10"])
        self.assertEqual(args.get("status"), "pending")
        self.assertEqual(args.get("limit"), "10")

    def test_long_flag_space(self):
        args = parse_args(["--status", "pending"])
        self.assertEqual(args.get("status"), "pending")

    def test_boolean_flag(self):
        args = parse_args(["--json"])
        self.assertTrue(args.has("json"))

    def test_short_flag(self):
        args = parse_args(["-j"])
        self.assertTrue(args.has("j"))

    def test_mixed(self):
        args = parse_args(["task", "list", "--status=pending", "-j"])
        self.assertEqual(args.pos, ["task", "list"])
        self.assertEqual(args.get("status"), "pending")
        self.assertTrue(args.has("j"))


class TestWorkspaceCommand(unittest.TestCase):

    def test_workspace_open_json(self):
        data = {
            "actor": {"actor_id": "hermes-a4", "harness": "Hermes"},
            "current_focus": {"assignment": "Define workspace packet"},
            "handoffs": {"inbox": [{"subject": "Review packet shape"}]},
            "agenda": {"items": [{"title": "Draft workspace packet"}]},
            "sessions": {"breadcrumbs": [{"session_binding_id": "sbind-1"}]},
            "workspace_refs": {"root": "/tmp/ws"},
        }
        rc, out, err = _run_cmd(["workspace", "open", "--actor", "hermes-a4", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertEqual(parsed["actor"]["actor_id"], "hermes-a4")

    def test_workspace_open_human(self):
        data = {
            "actor": {"actor_id": "hermes-a4", "harness": "Hermes"},
            "current_focus": {"assignment": "Define workspace packet"},
            "handoffs": {"inbox": [{"subject": "Review packet shape"}]},
            "agenda": {"items": [{"title": "Draft workspace packet"}]},
            "sessions": {"breadcrumbs": [{"session_binding_id": "sbind-1"}]},
            "workspace_refs": {"root": "/tmp/ws"},
        }
        rc, out, err = _run_cmd(["workspace", "open", "--actor", "hermes-a4"], response_body=data)
        self.assertEqual(rc, 0)
        self.assertIn("hermes-a4", out)
        self.assertIn("Define workspace packet", out)

    def test_handoff_inbox_json(self):
        data = {"handoffs": {"inbox": [{"subject": "Review packet shape", "from": "claude-a1"}]}}
        rc, out, err = _run_cmd(["workspace", "handoff-inbox", "--actor", "hermes-a4", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertEqual(parsed["handoffs"]["inbox"][0]["subject"], "Review packet shape")

    def test_agenda_json(self):
        data = {"agenda": {"items": [{"title": "Draft workspace packet", "status": "queued"}]}}
        rc, out, err = _run_cmd(["workspace", "agenda", "--actor", "hermes-a4", "--json"], response_body=data)
        self.assertEqual(rc, 0)
        parsed = json.loads(out)
        self.assertEqual(parsed["agenda"]["items"][0]["title"], "Draft workspace packet")


if __name__ == "__main__":
    unittest.main(verbosity=2)
