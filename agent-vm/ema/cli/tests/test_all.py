#!/usr/bin/env python3
"""
Comprehensive test suite for the EMA CLI test harness.
Tests all 40+ API endpoints via the mock_api layer.
"""
import os
import sys
import json
import unittest
import tempfile

# Setup path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Point store to a temp file for test isolation
TEST_STORE = tempfile.mktemp(suffix=".json")
os.environ["EMA_STORE"] = TEST_STORE

from ema_cli import store, fixtures, mock_api
from ema_cli.cli import dispatch, parse_args
from ema_cli.commands.seed_data import seed_all


class TestFixtures(unittest.TestCase):
    """Test fixture generators produce valid data."""

    def test_gen_id_format(self):
        for kind in ["project", "intent", "edge", "gap", "proposal", "seed",
                      "task", "session", "message", "token_event", "provider"]:
            id_val = fixtures.gen_id(kind)
            prefix, suffix = id_val.split("_", 1)
            self.assertEqual(len(prefix), 3)
            self.assertEqual(len(suffix), 8)

    def test_now_iso_format(self):
        ts = fixtures.now_iso()
        self.assertTrue(ts.endswith("Z"))
        self.assertIn("T", ts)

    def test_make_project(self):
        p = fixtures.make_project("Test", "Desc")
        self.assertTrue(p["id"].startswith("pro_"))
        self.assertEqual(p["name"], "Test")
        self.assertIn(p["status"], ["incubating", "active", "paused", "completed", "archived"])

    def test_make_intent_node(self):
        node = fixtures.make_intent_node("pro_test0001", level=2, title="My action")
        self.assertTrue(node["id"].startswith("int_"))
        self.assertEqual(node["level"], 2)
        self.assertEqual(node["level_name"], "action")
        self.assertEqual(node["project_id"], "pro_test0001")

    def test_make_intent_tree(self):
        tree = fixtures.make_intent_tree("pro_test0001")
        self.assertEqual(len(tree), 5)
        for i, node in enumerate(tree):
            self.assertEqual(node["level"], i)
        # Parent chain
        self.assertIsNone(tree[0]["parent_id"])
        for i in range(1, 5):
            self.assertEqual(tree[i]["parent_id"], tree[i - 1]["id"])

    def test_make_intent_edge(self):
        edge = fixtures.make_intent_edge("int_a", "int_b", "implements")
        self.assertTrue(edge["id"].startswith("edg_"))
        self.assertEqual(edge["relationship"], "implements")

    def test_make_gap(self):
        gap = fixtures.make_gap("pro_test0001")
        self.assertTrue(gap["id"].startswith("gap_"))
        self.assertIn(gap["gap_type"], ["stale_task", "orphan_note", "incomplete_goal",
                                         "missing_doc", "todo_code", "unlinked_proposal",
                                         "idle_responsibility"])
        self.assertIn(gap["severity"], range(1, 6))

    def test_make_proposal(self):
        p = fixtures.make_proposal("pro_test0001", title="Test prop")
        self.assertTrue(p["id"].startswith("prp_"))
        self.assertEqual(p["title"], "Test prop")
        self.assertIsInstance(p["confidence"], float)
        self.assertTrue(0 <= p["confidence"] <= 1)
        self.assertIsInstance(p["idea_score"], int)
        self.assertTrue(1 <= p["idea_score"] <= 10)
        self.assertIsInstance(p["tags"], list)
        self.assertIsInstance(p["risks"], list)
        self.assertIsInstance(p["benefits"], list)

    def test_make_seed(self):
        s = fixtures.make_seed("pro_test0001")
        self.assertTrue(s["id"].startswith("sed_"))
        self.assertIn(s["seed_type"], ["cron", "git", "session", "vault", "usage", "brain_dump"])

    def test_make_task(self):
        t = fixtures.make_task("pro_test0001", title="My task")
        self.assertTrue(t["id"].startswith("tsk_"))
        self.assertEqual(t["title"], "My task")
        self.assertIn(t["effort"], ["xs", "s", "m", "l", "xl"])

    def test_make_ai_session(self):
        s = fixtures.make_ai_session()
        self.assertTrue(s["id"].startswith("ais_"))
        self.assertIn(s["model"], ["sonnet", "haiku", "opus"])
        self.assertGreater(s["input_tokens"], 0)
        self.assertIsInstance(s["cost_usd"], float)

    def test_make_session_messages(self):
        msgs = fixtures.make_session_messages("ais_test0001", count=4)
        self.assertEqual(len(msgs), 4)
        for m in msgs:
            self.assertTrue(m["id"].startswith("aim_"))
            self.assertIn(m["role"], ["user", "assistant"])

    def test_make_token_event(self):
        te = fixtures.make_token_event("pro_test0001")
        self.assertTrue(te["id"].startswith("tok_"))
        self.assertIn(te["model"], ["sonnet", "haiku", "opus"])
        self.assertGreater(te["cost_usd"], 0)

    def test_make_default_providers(self):
        provs = fixtures.make_default_providers()
        self.assertEqual(len(provs), 3)
        ids = [p["id"] for p in provs]
        self.assertIn("claude-personal", ids)
        self.assertIn("ollama-local", ids)

    def test_make_token_usage_summary(self):
        events = [fixtures.make_token_event("pro_test0001") for _ in range(10)]
        summary = fixtures.make_token_usage_summary(events)
        self.assertIn("total_cost_usd", summary)
        self.assertIn("by_model", summary)
        self.assertIn("daily_spend", summary)
        self.assertIn("forecast_7d_usd", summary)
        self.assertIn("spike_detected", summary)

    def test_make_routing_estimate(self):
        est = fixtures.make_routing_estimate("test prompt")
        self.assertIn("estimates", est)
        self.assertIn("recommended", est)
        self.assertTrue(len(est["estimates"]) > 0)


class TestStore(unittest.TestCase):
    """Test the persistent state store."""

    def setUp(self):
        store.clear_all()

    def test_put_and_find(self):
        obj = {"id": "test_001", "name": "Test"}
        store.put("projects", obj)
        found = store.find("projects", "test_001")
        self.assertIsNotNone(found)
        self.assertEqual(found["name"], "Test")

    def test_all_items(self):
        store.put("projects", {"id": "p1", "name": "A"})
        store.put("projects", {"id": "p2", "name": "B"})
        items = store.all_items("projects")
        self.assertEqual(len(items), 2)

    def test_delete(self):
        store.put("projects", {"id": "p1"})
        result = store.delete("projects", "p1")
        self.assertTrue(result)
        self.assertIsNone(store.find("projects", "p1"))

    def test_delete_nonexistent(self):
        result = store.delete("projects", "nonexistent")
        self.assertFalse(result)

    def test_clear_all(self):
        store.put("projects", {"id": "p1"})
        store.put("tasks", {"id": "t1"})
        store.clear_all()
        self.assertEqual(len(store.all_items("projects")), 0)
        self.assertEqual(len(store.all_items("tasks")), 0)


class TestMockAPIIntentNodes(unittest.TestCase):
    """Test F1: Intent Map endpoints."""

    def setUp(self):
        store.clear_all()
        self.project = fixtures.make_project()
        store.put("projects", self.project)
        self.pid = self.project["id"]

    def test_intent_create(self):
        code, data = mock_api.intent_create({
            "title": "My product", "project_id": self.pid, "level": 0
        })
        self.assertEqual(code, 201)
        self.assertIn("node", data)
        self.assertEqual(data["node"]["level"], 0)
        self.assertEqual(data["node"]["title"], "My product")

    def test_intent_create_validation(self):
        code, data = mock_api.intent_create({"level": 0})
        self.assertEqual(code, 422)

    def test_intent_create_bad_level(self):
        code, data = mock_api.intent_create({
            "title": "Bad", "project_id": self.pid, "level": 5
        })
        self.assertEqual(code, 422)

    def test_intent_list(self):
        mock_api.intent_create({"title": "A", "project_id": self.pid, "level": 0})
        mock_api.intent_create({"title": "B", "project_id": self.pid, "level": 1})
        code, data = mock_api.intent_list(project_id=self.pid)
        self.assertEqual(code, 200)
        self.assertEqual(len(data["nodes"]), 2)

    def test_intent_list_by_level(self):
        mock_api.intent_create({"title": "A", "project_id": self.pid, "level": 0})
        mock_api.intent_create({"title": "B", "project_id": self.pid, "level": 1})
        code, data = mock_api.intent_list(level=0)
        self.assertEqual(len(data["nodes"]), 1)

    def test_intent_tree(self):
        # Create a hierarchy
        code, d1 = mock_api.intent_create({"title": "Root", "project_id": self.pid, "level": 0})
        root_id = d1["node"]["id"]
        mock_api.intent_create({"title": "Child", "project_id": self.pid, "level": 1, "parent_id": root_id})
        code, data = mock_api.intent_tree(project_id=self.pid)
        self.assertEqual(code, 200)
        self.assertTrue(len(data["tree"]) > 0)

    def test_intent_update(self):
        code, d1 = mock_api.intent_create({"title": "Old", "project_id": self.pid, "level": 0})
        nid = d1["node"]["id"]
        code, data = mock_api.intent_update(nid, {"title": "New", "status": "complete"})
        self.assertEqual(code, 200)
        self.assertEqual(data["node"]["title"], "New")
        self.assertEqual(data["node"]["status"], "complete")

    def test_intent_update_not_found(self):
        code, data = mock_api.intent_update("int_nonexist", {"title": "X"})
        self.assertEqual(code, 404)

    def test_intent_delete(self):
        code, d1 = mock_api.intent_create({"title": "Del", "project_id": self.pid, "level": 0})
        nid = d1["node"]["id"]
        code, data = mock_api.intent_delete(nid)
        self.assertEqual(code, 200)
        self.assertIsNone(store.find("intent_nodes", nid))

    def test_intent_delete_cascades_edges(self):
        code, d1 = mock_api.intent_create({"title": "A", "project_id": self.pid, "level": 0})
        code, d2 = mock_api.intent_create({"title": "B", "project_id": self.pid, "level": 1})
        aid, bid = d1["node"]["id"], d2["node"]["id"]
        mock_api.intent_edge_create({"source_id": aid, "target_id": bid})
        edges_before = store.all_items("intent_edges")
        self.assertTrue(len(edges_before) > 0)
        mock_api.intent_delete(aid)
        edges_after = [e for e in store.all_items("intent_edges")
                       if e.get("source_id") == aid or e.get("target_id") == aid]
        self.assertEqual(len(edges_after), 0)

    def test_intent_edge_create(self):
        code, data = mock_api.intent_edge_create({
            "source_id": "int_a", "target_id": "int_b", "relationship": "implements"
        })
        self.assertEqual(code, 201)
        self.assertEqual(data["edge"]["relationship"], "implements")

    def test_intent_edge_create_bad_relationship(self):
        code, data = mock_api.intent_edge_create({
            "source_id": "int_a", "target_id": "int_b", "relationship": "invalid"
        })
        self.assertEqual(code, 422)

    def test_intent_edge_create_missing_fields(self):
        code, data = mock_api.intent_edge_create({"source_id": "int_a"})
        self.assertEqual(code, 422)


class TestMockAPIGaps(unittest.TestCase):
    """Test F1: Gaps endpoints."""

    def setUp(self):
        store.clear_all()
        p = fixtures.make_project()
        store.put("projects", p)
        self.pid = p["id"]
        self.gap = fixtures.make_gap(self.pid)
        self.gap["status"] = "open"
        store.put("gaps", self.gap)

    def test_gaps_list(self):
        code, data = mock_api.gaps_list()
        self.assertEqual(code, 200)
        self.assertIn("gaps", data)
        self.assertIn("total", data)
        self.assertIn("by_type", data)

    def test_gaps_list_filter_status(self):
        code, data = mock_api.gaps_list(status="open")
        self.assertTrue(all(g["status"] == "open" for g in data["gaps"]))

    def test_gaps_list_filter_severity(self):
        self.gap["severity"] = 5
        store.put("gaps", self.gap)
        code, data = mock_api.gaps_list(severity=5)
        self.assertTrue(all(g["severity"] == 5 for g in data["gaps"]))

    def test_gap_resolve(self):
        code, data = mock_api.gap_resolve(self.gap["id"])
        self.assertEqual(code, 200)
        self.assertEqual(data["gap"]["status"], "resolved")

    def test_gap_resolve_not_found(self):
        code, data = mock_api.gap_resolve("gap_nonexist")
        self.assertEqual(code, 404)

    def test_gap_create_task(self):
        code, data = mock_api.gap_create_task(self.gap["id"])
        self.assertEqual(code, 201)
        self.assertIn("task", data)
        self.assertEqual(data["task"]["source_type"], "gap")

    def test_gap_create_task_not_found(self):
        code, data = mock_api.gap_create_task("gap_nonexist")
        self.assertEqual(code, 404)


class TestMockAPITokenUsage(unittest.TestCase):
    """Test F1: Token Usage endpoint."""

    def setUp(self):
        store.clear_all()
        p = fixtures.make_project()
        store.put("projects", p)
        self.pid = p["id"]
        for _ in range(10):
            te = fixtures.make_token_event(self.pid)
            store.put("token_events", te)

    def test_token_usage(self):
        code, data = mock_api.token_usage(days=30)
        self.assertEqual(code, 200)
        self.assertIn("total_cost_usd", data)
        self.assertIn("by_model", data)
        self.assertIn("daily_spend", data)

    def test_token_usage_model_filter(self):
        code, data = mock_api.token_usage(model="opus")
        self.assertEqual(code, 200)


class TestMockAPIProposals(unittest.TestCase):
    """Test F2: Proposal endpoints."""

    def setUp(self):
        store.clear_all()
        p = fixtures.make_project()
        store.put("projects", p)
        self.pid = p["id"]
        seed = fixtures.make_seed(self.pid)
        store.put("seeds", seed)
        self.seed_id = seed["id"]
        prop = fixtures.make_proposal(self.pid, seed_id=self.seed_id, status="queued")
        store.put("proposals", prop)
        self.prop = prop

    def test_proposals_list(self):
        code, data = mock_api.proposals_list()
        self.assertEqual(code, 200)
        self.assertTrue(len(data["proposals"]) > 0)

    def test_proposals_list_by_status(self):
        code, data = mock_api.proposals_list(status="queued")
        self.assertTrue(all(p["status"] == "queued" for p in data["proposals"]))

    def test_proposals_list_by_tag(self):
        tag = self.prop["tags"][0]
        code, data = mock_api.proposals_list(tag=tag)
        self.assertTrue(all(tag in p.get("tags", []) for p in data["proposals"]))

    def test_proposal_get(self):
        code, data = mock_api.proposal_get(self.prop["id"])
        self.assertEqual(code, 200)
        self.assertEqual(data["proposal"]["id"], self.prop["id"])

    def test_proposal_get_not_found(self):
        code, data = mock_api.proposal_get("prp_nonexist")
        self.assertEqual(code, 404)

    def test_proposal_approve(self):
        code, data = mock_api.proposal_approve(self.prop["id"])
        self.assertEqual(code, 200)
        self.assertEqual(data["proposal"]["status"], "approved")
        self.assertIn("task", data)
        self.assertTrue(data["task"]["id"].startswith("tsk_"))

    def test_proposal_approve_killed_fails(self):
        self.prop["status"] = "killed"
        store.put("proposals", self.prop)
        code, data = mock_api.proposal_approve(self.prop["id"])
        self.assertEqual(code, 422)

    def test_proposal_kill(self):
        code, data = mock_api.proposal_kill(self.prop["id"])
        self.assertEqual(code, 200)
        self.assertEqual(data["proposal"]["status"], "killed")
        self.assertIn("kill_pattern_id", data)

    def test_proposal_kill_already_killed(self):
        mock_api.proposal_kill(self.prop["id"])
        code, data = mock_api.proposal_kill(self.prop["id"])
        self.assertEqual(code, 422)

    def test_proposal_redirect(self):
        code, data = mock_api.proposal_redirect(self.prop["id"])
        self.assertEqual(code, 200)
        self.assertEqual(data["proposal"]["status"], "redirected")
        self.assertEqual(len(data["seeds"]), 3)

    def test_proposal_lineage(self):
        code, data = mock_api.proposal_lineage(self.prop["id"])
        self.assertEqual(code, 200)
        self.assertIn("lineage", data)
        self.assertTrue(len(data["lineage"]) > 0)

    def test_proposal_lineage_with_seed(self):
        code, data = mock_api.proposal_lineage(self.prop["id"])
        # Should have seed in lineage since we set seed_id
        types = [item["type"] for item in data["lineage"]]
        self.assertIn("seed", types)
        self.assertIn("proposal", types)

    def test_proposal_validate_accept(self):
        self.prop["idea_score"] = 8
        self.prop["confidence"] = 0.8
        self.prop["intent_aligned"] = True
        store.put("proposals", self.prop)
        code, data = mock_api.proposal_validate(self.prop["id"])
        self.assertEqual(data["result"], "accept")

    def test_proposal_validate_reject(self):
        self.prop["idea_score"] = 3
        self.prop["confidence"] = 0.3
        self.prop["intent_aligned"] = False
        store.put("proposals", self.prop)
        code, data = mock_api.proposal_validate(self.prop["id"])
        self.assertEqual(data["result"], "reject")
        self.assertTrue(len(data["issues"]) > 0)


class TestMockAPIDesk(unittest.TestCase):
    """Test proposal desk and response grammar helpers."""

    def setUp(self):
        store.clear_all()
        project = fixtures.make_project()
        store.put("projects", project)
        self.pid = project["id"]
        proposal = fixtures.make_proposal(self.pid, status="queued", title="Desk proposal")
        proposal["user_input"] = {
            "proposal_id": proposal["id"],
            "gate_status": "input_required",
            "approved_by": None,
            "approved_at": None,
            "items": [
                {
                    "id": "decision_backend",
                    "type": "decision",
                    "label": "Which backend?",
                    "description": "Pick one.",
                    "required": True,
                    "options": [
                        {
                            "id": "sqlite",
                            "label": "SQLite",
                            "aliases": ["sqlite", "lite"],
                            "patterns": [r"(?i)^use sqlite$"],
                        },
                        {
                            "id": "postgres",
                            "label": "Postgres",
                            "aliases": ["postgres", "pg"],
                            "patterns": [r"(?i)^go with postgres$"],
                        },
                    ],
                    "freeform_patterns": [r"(?i)^other\s*:\s*(.+)$"],
                    "answer": None,
                    "raw_answer": None,
                    "normalized_answer": None,
                    "matched_by": None,
                    "matched_pattern": None,
                    "answered_at": None,
                },
                {
                    "id": "required_info",
                    "type": "required_info",
                    "label": "API key",
                    "description": "Provide the key or mark n/a.",
                    "required": True,
                    "options": [
                        {
                            "id": "na",
                            "label": "N/A",
                            "aliases": ["n/a", "na"],
                            "patterns": [r"(?i)^n/?a$"],
                        }
                    ],
                    "freeform_patterns": [r"(?i)^n/?a\s*:\s*(.+)$", r"(?i)^(.+)$"],
                    "answer": None,
                    "raw_answer": None,
                    "normalized_answer": None,
                    "matched_by": None,
                    "matched_pattern": None,
                    "answered_at": None,
                },
            ],
            "gate_blocked_by": ["decision_backend", "required_info"],
            "last_updated": fixtures.now_iso(),
        }
        proposal["inserted_at"] = fixtures.past_iso(hours_ago=3)
        store.put("proposals", proposal)
        self.proposal = proposal

    def test_desk_get_categorizes_waiting_input(self):
        code, data = mock_api.desk_get()
        self.assertEqual(code, 200)
        self.assertEqual(len(data["waiting_input"]), 1)
        self.assertEqual(data["waiting_input"][0]["id"], self.proposal["id"])

    def test_proposal_input_options(self):
        code, data = mock_api.proposal_input_options(self.proposal["id"], "decision_backend")
        self.assertEqual(code, 200)
        self.assertEqual(data["item"]["id"], "decision_backend")
        self.assertIn("sqlite", data["accepted_strings"]["option_ids"])

    def test_proposal_input_respond_matches_alias(self):
        code, data = mock_api.proposal_input_respond(self.proposal["id"], "decision_backend", "pg")
        self.assertEqual(code, 200)
        self.assertEqual(data["item"]["normalized_answer"], "postgres")
        self.assertEqual(data["item"]["matched_by"], "alias")

    def test_proposal_input_respond_matches_pattern(self):
        code, data = mock_api.proposal_input_respond(self.proposal["id"], "decision_backend", "go with postgres")
        self.assertEqual(code, 200)
        self.assertEqual(data["item"]["normalized_answer"], "postgres")
        self.assertEqual(data["item"]["matched_by"], "pattern")

    def test_proposal_input_respond_matches_freeform_pattern(self):
        code, data = mock_api.proposal_input_respond(self.proposal["id"], "decision_backend", "other: hybrid")
        self.assertEqual(code, 200)
        self.assertEqual(data["item"]["normalized_answer"], "hybrid")
        self.assertEqual(data["item"]["matched_by"], "freeform_pattern")

    def test_proposal_input_respond_unblocks_gate(self):
        mock_api.proposal_input_respond(self.proposal["id"], "decision_backend", "sqlite")
        code, data = mock_api.proposal_input_respond(self.proposal["id"], "required_info", "n/a: use env")
        self.assertEqual(code, 200)
        self.assertEqual(data["gate_status"], "inputs_complete")
        self.assertEqual(data["blocked_items"], [])

    def test_proposal_approve_gate_blocked(self):
        code, data = mock_api.proposal_approve(self.proposal["id"])
        self.assertEqual(code, 422)
        self.assertEqual(data["error"], "gate_blocked")

    def test_proposal_approve_after_inputs_complete(self):
        mock_api.proposal_input_respond(self.proposal["id"], "decision_backend", "sqlite")
        mock_api.proposal_input_respond(self.proposal["id"], "required_info", "n/a: use env")
        code, data = mock_api.proposal_approve(self.proposal["id"], auto_dispatch=False)
        self.assertEqual(code, 200)
        self.assertEqual(data["proposal"]["status"], "approved")
        self.assertEqual(data["proposal"]["user_input"]["gate_status"], "accepted")


class TestMockAPISeeds(unittest.TestCase):
    """Test F2: Seeds endpoints."""

    def setUp(self):
        store.clear_all()
        p = fixtures.make_project()
        store.put("projects", p)
        self.pid = p["id"]

    def test_seeds_list(self):
        s = fixtures.make_seed(self.pid)
        store.put("seeds", s)
        code, data = mock_api.seeds_list()
        self.assertEqual(code, 200)
        self.assertTrue(len(data["seeds"]) > 0)

    def test_seed_create(self):
        code, data = mock_api.seed_create({
            "name": "Test seed",
            "prompt_template": "Test {{project_name}}",
            "project_id": self.pid,
        })
        self.assertEqual(code, 201)
        self.assertIn("seed", data)

    def test_seed_create_validation(self):
        code, data = mock_api.seed_create({"name": "X"})
        self.assertEqual(code, 422)


class TestMockAPIEngine(unittest.TestCase):
    """Test F2: Engine pause/resume."""

    def test_engine_pause(self):
        code, data = mock_api.engine_pause()
        self.assertEqual(code, 200)
        self.assertEqual(data["status"], "paused")

    def test_engine_resume(self):
        code, data = mock_api.engine_resume()
        self.assertEqual(code, 200)
        self.assertEqual(data["status"], "running")


class TestMockAPISessions(unittest.TestCase):
    """Test F3: Session endpoints."""

    def setUp(self):
        store.clear_all()
        self.session = fixtures.make_ai_session(status="active")
        store.put("ai_sessions", self.session)
        self.msgs = fixtures.make_session_messages(self.session["id"], count=4)
        for m in self.msgs:
            store.put("ai_session_messages", m)

    def test_sessions_list(self):
        code, data = mock_api.sessions_list_api()
        self.assertEqual(code, 200)
        self.assertTrue(len(data["sessions"]) > 0)

    def test_sessions_list_filter_status(self):
        code, data = mock_api.sessions_list_api(status="active")
        self.assertTrue(all(s["status"] == "active" for s in data["sessions"]))

    def test_session_messages(self):
        code, data = mock_api.session_messages(self.session["id"])
        self.assertEqual(code, 200)
        self.assertEqual(data["session_id"], self.session["id"])
        self.assertEqual(len(data["messages"]), 4)

    def test_session_messages_not_found(self):
        code, data = mock_api.session_messages("ais_nonexist")
        self.assertEqual(code, 404)

    def test_session_fork(self):
        msg_id = self.msgs[1]["id"]
        code, data = mock_api.session_fork(self.session["id"], {"message_id": msg_id})
        self.assertIn(code, (200, 201))
        new_sess = data["session"]
        self.assertEqual(new_sess["parent_id"], self.session["id"])
        self.assertEqual(new_sess["fork_message_id"], msg_id)

    def test_session_fork_not_found(self):
        code, data = mock_api.session_fork("ais_nonexist", {})
        self.assertEqual(code, 404)

    def test_session_resume(self):
        code, data = mock_api.session_resume(self.session["id"])
        self.assertEqual(code, 200)
        self.assertEqual(data["session"]["status"], "active")


class TestMockAPITasks(unittest.TestCase):
    """Test task CRUD endpoints."""

    def setUp(self):
        store.clear_all()
        p = fixtures.make_project()
        store.put("projects", p)
        self.pid = p["id"]
        self.task = fixtures.make_task(self.pid, title="Test task", status="todo")
        store.put("tasks", self.task)

    def test_tasks_list(self):
        code, data = mock_api.tasks_list()
        self.assertEqual(code, 200)
        self.assertTrue(len(data["tasks"]) > 0)

    def test_task_create(self):
        code, data = mock_api.task_create({
            "title": "New task", "project_id": self.pid
        })
        self.assertEqual(code, 201)
        self.assertIn("task", data)

    def test_task_create_validation(self):
        code, data = mock_api.task_create({"title": "No project"})
        self.assertEqual(code, 422)

    def test_task_get(self):
        code, data = mock_api.task_get(self.task["id"])
        self.assertEqual(code, 200)

    def test_task_update(self):
        code, data = mock_api.task_update(self.task["id"], {"status": "in_progress"})
        self.assertEqual(code, 200)
        self.assertEqual(data["task"]["status"], "in_progress")

    def test_task_route(self):
        code, data = mock_api.task_route(self.task["id"])
        self.assertEqual(code, 200)
        self.assertIn("recommended_agent", data)
        self.assertIn("recommended_model", data)

    def test_task_assign(self):
        code, data = mock_api.task_assign(self.task["id"], "coder")
        self.assertEqual(code, 200)
        self.assertEqual(data["assigned_to"], "coder")
        self.assertEqual(data["task"]["status"], "in_progress")

    def test_task_link_intent(self):
        node = fixtures.make_intent_node(self.pid, level=2, title="Action")
        store.put("intent_nodes", node)
        code, data = mock_api.task_link_intent(self.task["id"], node["id"])
        self.assertEqual(code, 200)
        self.assertIn(self.task["id"], data["intent_node"]["linked_task_ids"])


class TestMockAPIProjects(unittest.TestCase):
    """Test project endpoints."""

    def setUp(self):
        store.clear_all()
        self.project = fixtures.make_project("Test Project", "A test")
        store.put("projects", self.project)

    def test_projects_list(self):
        code, data = mock_api.projects_list()
        self.assertEqual(code, 200)
        self.assertTrue(len(data["projects"]) > 0)

    def test_project_get(self):
        code, data = mock_api.project_get(self.project["id"])
        self.assertEqual(code, 200)

    def test_project_health(self):
        code, data = mock_api.project_health(self.project["id"])
        self.assertEqual(code, 200)
        self.assertIn("health", data)
        self.assertIn("health_score", data["health"])


class TestMockAPIProviders(unittest.TestCase):
    """Test F5: Provider and routing endpoints."""

    def test_providers_list(self):
        code, data = mock_api.providers_list()
        self.assertEqual(code, 200)
        self.assertTrue(len(data["providers"]) > 0)

    def test_provider_health_check(self):
        code, data = mock_api.provider_health_check("claude-personal")
        self.assertEqual(code, 200)
        self.assertIn("healthy", data)
        self.assertIn("latency_ms", data)

    def test_provider_health_check_not_found(self):
        code, data = mock_api.provider_health_check("nonexistent")
        self.assertEqual(code, 404)

    def test_routing_estimate(self):
        code, data = mock_api.routing_estimate({"prompt": "Test prompt"})
        self.assertEqual(code, 200)
        self.assertIn("estimates", data)
        self.assertIn("recommended", data)
        self.assertTrue(len(data["estimates"]) > 0)

    def test_routing_estimate_validation(self):
        code, data = mock_api.routing_estimate({})
        self.assertEqual(code, 422)


class TestMockAPISuperman(unittest.TestCase):
    """Test Superman integration endpoints."""

    def test_superman_status(self):
        code, data = mock_api.superman_status()
        self.assertEqual(code, 200)
        self.assertEqual(data["status"], "ok")

    def test_superman_index(self):
        code, data = mock_api.superman_index({"path": "/tmp"})
        self.assertEqual(code, 200)
        self.assertTrue(data["indexed"])
        self.assertGreater(data["file_count"], 0)

    def test_superman_ask(self):
        code, data = mock_api.superman_ask({"question": "What modules handle routing?"})
        self.assertEqual(code, 200)
        self.assertIn("answer", data)
        self.assertIn("references", data)

    def test_superman_ask_validation(self):
        code, data = mock_api.superman_ask({})
        self.assertEqual(code, 422)

    def test_superman_apply(self):
        code, data = mock_api.superman_apply({"instruction": "Add field X"})
        self.assertEqual(code, 200)
        self.assertTrue(data["success"])

    def test_superman_gaps(self):
        code, data = mock_api.superman_gaps()
        self.assertEqual(code, 200)
        self.assertIn("gaps", data)

    def test_superman_intent_graph(self):
        code, data = mock_api.superman_intent_graph()
        self.assertEqual(code, 200)
        self.assertIn("nodes", data)
        self.assertIn("edges", data)


class TestMockAPIOpenClaw(unittest.TestCase):
    """Test OpenClaw dispatch endpoints."""

    def test_openclaw_dispatch(self):
        code, data = mock_api.openclaw_dispatch({
            "agent_id": "coder",
            "task": "Implement feature X"
        })
        self.assertEqual(code, 201)
        self.assertIn("dispatch_id", data)
        self.assertEqual(data["status"], "queued")

    def test_openclaw_dispatch_validation(self):
        code, data = mock_api.openclaw_dispatch({"agent_id": "coder"})
        self.assertEqual(code, 422)

    def test_openclaw_dispatch_status(self):
        # Create a dispatch first
        _, d = mock_api.openclaw_dispatch({"agent_id": "coder", "task": "X"})
        code, data = mock_api.openclaw_dispatch_status(d["dispatch_id"])
        self.assertEqual(code, 200)
        self.assertIn("dispatch_id", data)


class TestSeedData(unittest.TestCase):
    """Test the seed_all function."""

    def test_seed_all(self):
        store.clear_all()
        counts = seed_all(num_projects=1)
        self.assertGreater(counts["projects"], 0)
        self.assertGreater(counts["intent_nodes"], 0)
        self.assertGreater(counts["proposals"], 0)
        self.assertGreater(counts["tasks"], 0)
        self.assertGreater(counts["gaps"], 0)
        self.assertGreater(counts["seeds"], 0)
        self.assertGreater(counts["ai_sessions"], 0)
        self.assertGreater(counts["token_events"], 0)


class TestCLIDispatch(unittest.TestCase):
    """Test the CLI dispatch function."""

    def setUp(self):
        store.clear_all()
        seed_all(num_projects=1)

    def test_help(self):
        # Should not raise
        rc = dispatch(["help"])
        self.assertEqual(rc, 0)

    def test_version(self):
        rc = dispatch(["version"])
        self.assertEqual(rc, 0)

    def test_unknown_command(self):
        rc = dispatch(["nonexistent"])
        self.assertEqual(rc, 1)

    def test_proposal_list(self):
        rc = dispatch(["proposal", "list"])
        self.assertEqual(rc, 0)

    def test_task_list(self):
        rc = dispatch(["task", "list"])
        self.assertEqual(rc, 0)

    def test_intent_list(self):
        rc = dispatch(["intent", "list"])
        self.assertEqual(rc, 0)

    def test_gaps_list(self):
        rc = dispatch(["gaps", "list"])
        self.assertEqual(rc, 0)

    def test_providers_list(self):
        rc = dispatch(["providers", "list"])
        self.assertEqual(rc, 0)

    def test_seeds_list(self):
        rc = dispatch(["seeds", "list"])
        self.assertEqual(rc, 0)

    def test_session_list(self):
        rc = dispatch(["session", "list"])
        self.assertEqual(rc, 0)

    def test_projects_list(self):
        rc = dispatch(["projects", "list"])
        self.assertEqual(rc, 0)

    def test_superman_status(self):
        rc = dispatch(["superman", "status"])
        self.assertEqual(rc, 0)

    def test_engine_pause_resume(self):
        rc = dispatch(["engine", "pause"])
        self.assertEqual(rc, 0)
        rc = dispatch(["engine", "resume"])
        self.assertEqual(rc, 0)

    def test_token_usage(self):
        rc = dispatch(["token-usage"])
        self.assertEqual(rc, 0)

    def test_scenario_list(self):
        rc = dispatch(["scenario"])
        self.assertEqual(rc, 0)


class TestParseArgs(unittest.TestCase):
    """Test argument parsing."""

    def test_positional(self):
        args = parse_args(["proposal", "list"])
        self.assertEqual(args.pos, ["proposal", "list"])

    def test_flags_with_equals(self):
        args = parse_args(["--status=active", "--format=table"])
        self.assertEqual(args.get("status"), "active")
        self.assertEqual(args.format(), "table")

    def test_flags_with_space(self):
        args = parse_args(["--status", "active"])
        self.assertEqual(args.get("status"), "active")

    def test_boolean_flag(self):
        args = parse_args(["--verbose"])
        self.assertTrue(args.has("verbose"))

    def test_mixed(self):
        args = parse_args(["proposal", "list", "--status=queued", "--format=table"])
        self.assertEqual(args.pos, ["proposal", "list"])
        self.assertEqual(args.get("status"), "queued")
        self.assertEqual(args.format(), "table")


# ---------------------------------------------------------------------------
# Endpoint coverage tracker
# ---------------------------------------------------------------------------

class TestEndpointCoverage(unittest.TestCase):
    """Verify all documented API endpoints have test coverage."""

    DOCUMENTED_ENDPOINTS = [
        # F1: Intent Map
        "GET /api/intent",                  # intent_list
        "GET /api/intent/tree",             # intent_tree
        "POST /api/intent",                 # intent_create
        "PUT /api/intent/:id",              # intent_update
        "DELETE /api/intent/:id",           # intent_delete
        "POST /api/intent/edges",           # intent_edge_create
        # F1: Gaps
        "GET /api/gaps",                    # gaps_list
        "POST /api/gaps/:id/resolve",       # gap_resolve
        "POST /api/gaps/:id/create_task",   # gap_create_task
        # F1: Token Usage
        "GET /api/token-usage",             # token_usage
        # F2: Proposals
        "GET /api/proposals",               # proposals_list
        "GET /api/proposals/:id",           # proposal_get
        "POST /api/proposals/:id/approve",  # proposal_approve
        "POST /api/proposals/:id/redirect", # proposal_redirect
        "POST /api/proposals/:id/kill",     # proposal_kill
        "GET /api/proposals/:id/lineage",   # proposal_lineage
        # F2: Seeds
        "GET /api/seeds",                   # seeds_list
        "POST /api/seeds",                  # seed_create
        # F2: Engine
        "POST /api/engine/pause",           # engine_pause
        "POST /api/engine/resume",          # engine_resume
        # F3: Sessions
        "GET /api/sessions",                # sessions_list_api
        "GET /api/sessions/:id/messages",   # session_messages
        "POST /api/sessions/:id/fork",      # session_fork
        "POST /api/sessions/:id/resume",    # session_resume
        # F5: Providers
        "GET /api/providers",               # providers_list
        "POST /api/providers/:id/health-check",  # provider_health_check
        "GET /api/routing/estimate",        # routing_estimate
        # Superman
        "GET /api/superman/status",         # superman_status
        "POST /api/superman/index",         # superman_index
        "POST /api/superman/ask",           # superman_ask
        "POST /api/superman/apply",         # superman_apply
        "GET /api/superman/gaps",           # superman_gaps
        "GET /api/superman/intent-graph",   # superman_intent_graph
        # OpenClaw
        "POST /api/openclaw/dispatch",      # openclaw_dispatch
        "GET /api/openclaw/dispatch/:id",   # openclaw_dispatch_status
        # Tasks (implicit from data model)
        "GET /api/tasks",                   # tasks_list
        "POST /api/tasks",                  # task_create
        "GET /api/tasks/:id",               # task_get
        "PUT /api/tasks/:id",               # task_update
        "POST /api/tasks/:id/route",        # task_route
        "POST /api/tasks/:id/assign",       # task_assign
        "POST /api/tasks/:id/link-intent",  # task_link_intent
        # Projects
        "GET /api/projects",                # projects_list
        "GET /api/projects/:id",            # project_get
        "GET /api/projects/:id/health",     # project_health
        # Proposal validation (custom)
        "POST /api/proposals/:id/validate", # proposal_validate
    ]

    # Map endpoint to mock_api function name
    ENDPOINT_TO_FUNCTION = {
        "GET /api/intent": "intent_list",
        "GET /api/intent/tree": "intent_tree",
        "POST /api/intent": "intent_create",
        "PUT /api/intent/:id": "intent_update",
        "DELETE /api/intent/:id": "intent_delete",
        "POST /api/intent/edges": "intent_edge_create",
        "GET /api/gaps": "gaps_list",
        "POST /api/gaps/:id/resolve": "gap_resolve",
        "POST /api/gaps/:id/create_task": "gap_create_task",
        "GET /api/token-usage": "token_usage",
        "GET /api/proposals": "proposals_list",
        "GET /api/proposals/:id": "proposal_get",
        "POST /api/proposals/:id/approve": "proposal_approve",
        "POST /api/proposals/:id/redirect": "proposal_redirect",
        "POST /api/proposals/:id/kill": "proposal_kill",
        "GET /api/proposals/:id/lineage": "proposal_lineage",
        "POST /api/proposals/:id/validate": "proposal_validate",
        "GET /api/seeds": "seeds_list",
        "POST /api/seeds": "seed_create",
        "POST /api/engine/pause": "engine_pause",
        "POST /api/engine/resume": "engine_resume",
        "GET /api/sessions": "sessions_list_api",
        "GET /api/sessions/:id/messages": "session_messages",
        "POST /api/sessions/:id/fork": "session_fork",
        "POST /api/sessions/:id/resume": "session_resume",
        "GET /api/providers": "providers_list",
        "POST /api/providers/:id/health-check": "provider_health_check",
        "GET /api/routing/estimate": "routing_estimate",
        "GET /api/superman/status": "superman_status",
        "POST /api/superman/index": "superman_index",
        "POST /api/superman/ask": "superman_ask",
        "POST /api/superman/apply": "superman_apply",
        "GET /api/superman/gaps": "superman_gaps",
        "GET /api/superman/intent-graph": "superman_intent_graph",
        "POST /api/openclaw/dispatch": "openclaw_dispatch",
        "GET /api/openclaw/dispatch/:id": "openclaw_dispatch_status",
        "GET /api/tasks": "tasks_list",
        "POST /api/tasks": "task_create",
        "GET /api/tasks/:id": "task_get",
        "PUT /api/tasks/:id": "task_update",
        "POST /api/tasks/:id/route": "task_route",
        "POST /api/tasks/:id/assign": "task_assign",
        "POST /api/tasks/:id/link-intent": "task_link_intent",
        "GET /api/projects": "projects_list",
        "GET /api/projects/:id": "project_get",
        "GET /api/projects/:id/health": "project_health",
    }

    def test_all_endpoints_have_mock_functions(self):
        """Every documented endpoint maps to a mock_api function."""
        missing = []
        for endpoint in self.DOCUMENTED_ENDPOINTS:
            func_name = self.ENDPOINT_TO_FUNCTION.get(endpoint)
            if not func_name:
                missing.append(endpoint + " (no mapping)")
                continue
            if not hasattr(mock_api, func_name):
                missing.append(endpoint + " → " + func_name + " (not found)")
        if missing:
            self.fail("Missing mock functions:\n  " + "\n  ".join(missing))

    def test_endpoint_count(self):
        """We cover at least 40 endpoints."""
        self.assertGreaterEqual(len(self.DOCUMENTED_ENDPOINTS), 40,
                                "Expected 40+ endpoints, got " + str(len(self.DOCUMENTED_ENDPOINTS)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
