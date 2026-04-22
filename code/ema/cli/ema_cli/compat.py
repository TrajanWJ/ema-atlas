"""
Compatibility helpers for daemon builds that expose control-plane surfaces
before full CRUD endpoints exist.
"""
from . import client
from .client import DaemonError


def projects_list():
    code, data = client.get("/api/projects")
    if code == 200:
        return code, data.get("projects", data.get("data", []))

    code, cp = client.get("/api/control-plane")
    if code == 200:
        projects = []
        for p in cp.get("projects", []):
            counts = p.get("counts", {})
            repo = p.get("repo_context", {})
            projects.append({
                "id": p.get("project"),
                "name": p.get("project"),
                "slug": p.get("project"),
                "status": "active",
                "linked_path": repo.get("project_root"),
                "proposal_count": counts.get("proposals"),
                "task_count": counts.get("tasks"),
                "execution_count": counts.get("executions"),
                "outcome_count": counts.get("outcomes"),
            })
        return 200, projects

    return code, data


def project_show(project_ref):
    code, data = client.get(f"/api/projects/{project_ref}")
    if code == 200:
        return code, data.get("project", data.get("data", data))

    code, cp = client.get("/api/control-plane/context_for", params={"project": project_ref})
    if code == 200:
        repo = cp.get("repo_context", {})
        counts = cp.get("counts", {})
        project = {
            "id": cp.get("project", project_ref),
            "name": cp.get("project", project_ref),
            "slug": cp.get("project", project_ref),
            "status": "active",
            "linked_path": repo.get("project_root"),
            "description": cp.get("summary"),
            "proposal_count": counts.get("proposals"),
            "task_count": counts.get("tasks"),
            "execution_count": counts.get("executions"),
            "repo_context": repo,
            "active_goals": cp.get("active_goals", []),
            "bounded_working_set": cp.get("bounded_working_set", []),
            "relevant_outcomes": cp.get("relevant_outcomes", []),
        }
        return 200, project

    return code, data


def proposals_list(project=None):
    params = {"project_id": project} if project else None
    code, data = client.get("/api/proposals", params=params)
    if code == 200:
        return code, data.get("proposals", data.get("data", []))

    code, cp = client.get("/api/control-plane")
    if code == 200:
        proposals = []
        for p in cp.get("projects", []):
            if project and p.get("project") != project:
                continue
            for item in p.get("bounded_working_set", []):
                if str(item.get("id", "")).startswith("prp_"):
                    proposals.append({
                        "id": item.get("id"),
                        "title": item.get("summary") or item.get("intent") or item.get("id"),
                        "summary": item.get("summary"),
                        "status": item.get("status"),
                        "project_id": item.get("project"),
                        "inserted_at": item.get("created_at"),
                        "updated_at": item.get("updated_at"),
                        "intent": item.get("intent"),
                        "approved_by": item.get("approved_by"),
                    })
        return 200, proposals

    return code, data


def proposal_show(proposal_id):
    code, data = client.get(f"/api/proposals/{proposal_id}")
    if code == 200:
        return code, data.get("proposal", data.get("data", data))

    code, cp = client.get("/api/control-plane")
    if code == 200:
        for p in cp.get("projects", []):
            for item in p.get("bounded_working_set", []):
                if item.get("id") == proposal_id and str(proposal_id).startswith("prp_"):
                    return 200, {
                        "id": item.get("id"),
                        "title": item.get("summary") or item.get("intent") or item.get("id"),
                        "summary": item.get("summary"),
                        "status": item.get("status"),
                        "project_id": item.get("project"),
                        "inserted_at": item.get("created_at"),
                        "updated_at": item.get("updated_at"),
                        "intent": item.get("intent"),
                        "context": item.get("context"),
                        "metadata": item.get("metadata"),
                        "execution_ids": item.get("execution_ids", []),
                        "approved_by": item.get("approved_by"),
                    }
        return 404, {"error": "not_found"}

    return code, data


def executions_list(status=None, limit=None):
    params = {}
    if status:
        params["status"] = status
    if limit:
        params["limit"] = limit
    code, data = client.get("/api/executions", params=params or None)
    if code == 200:
        return code, data.get("executions", data.get("data", []))

    code, cp = client.get("/api/control-plane")
    if code == 200:
        execs = []
        for p in cp.get("projects", []):
            for item in p.get("bounded_working_set", []):
                if str(item.get("id", "")).startswith("exe_"):
                    execs.append({
                        "id": item.get("id"),
                        "agent_id": item.get("operator") or item.get("adapter") or "unknown",
                        "status": item.get("status"),
                        "task_id": item.get("proposal_id"),
                        "model": (item.get("metadata") or {}).get("model"),
                        "inserted_at": item.get("created_at") or item.get("started_at"),
                        "updated_at": item.get("updated_at") or item.get("completed_at"),
                        "project_id": item.get("project"),
                        "intent": item.get("intent"),
                    })
        if status:
            execs = [e for e in execs if e.get("status") == status]
        if limit:
            execs = execs[: int(limit)]
        return 200, execs

    return code, data


def execution_show(execution_id):
    code, data = client.get(f"/api/executions/{execution_id}")
    if code == 200:
        return code, data.get("execution", data.get("data", data))

    code, cp = client.get("/api/control-plane")
    if code == 200:
        for p in cp.get("projects", []):
            for item in p.get("bounded_working_set", []):
                if item.get("id") == execution_id and str(execution_id).startswith("exe_"):
                    return 200, item
        return 404, {"error": "not_found"}

    return code, data


def tasks_list(project=None, status=None, limit=None):
    params = {}
    if project:
        params["project_id"] = project
    if status:
        params["status"] = status
    if limit:
        params["limit"] = limit
    code, data = client.get("/api/tasks", params=params or None)
    if code == 200:
        return code, data.get("tasks", data.get("data", []))

    code, host = client.get("/api/surfaces/host-truth")
    if code == 200:
        tasks = []
        for bucket in ("queue", "active", "failed", "done"):
            for item in host.get("recent", {}).get(bucket, []):
                task = {
                    "id": item.get("id"),
                    "title": item.get("description") or item.get("id"),
                    "description": item.get("description"),
                    "status": item.get("status") or bucket,
                    "priority": None,
                    "due_date": None,
                    "agent": item.get("agent"),
                    "project_id": project,
                    "inserted_at": item.get("created_at"),
                    "updated_at": item.get("done_at") or item.get("failed_at") or item.get("claimed_at"),
                    "raw_file": item.get("raw_file"),
                    "result_file": item.get("result_file"),
                    "path": item.get("path"),
                }
                tasks.append(task)
        if status:
            tasks = [t for t in tasks if t.get("status") == status]
        if limit:
            tasks = tasks[: int(limit)]
        return 200, tasks

    return code, data


def task_show(task_id):
    code, data = client.get(f"/api/tasks/{task_id}")
    if code == 200:
        return code, data.get("task", data.get("data", data))

    code, tasks = tasks_list(limit=500)
    if code == 200:
        for task in tasks:
            if task.get("id") == task_id:
                return 200, task
        return 404, {"error": "not_found"}

    return code, data
