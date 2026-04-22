"""
ema work — agent-oriented workflow primitives.

This command group turns EMA CLI into an active work ledger rather than a passive
inspection tool. The first slice is `ema work start`, which helps an agent:

1. verify daemon reachability
2. resolve project context
3. inspect pending tasks / running agents
4. create a task when needed
5. mark ownership / in-progress status
6. emit a compact work packet that can be used as the session's operating context
"""
from .. import client, compat
from ..client import DaemonError
from ..output import (
    print_json, print_error, print_info, print_success, print_warn, print_created,
    c, BOLD, CYAN, GREEN, YELLOW, GREY, GOLD, DIM,
)


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info("  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info("  → Or:  ema status")
    print_info("  → Or:  export EMA_HOST=<host:port>")


def _get(path, params=None):
    return client.get(path, params=params)


def _post(path, body=None):
    return client.post(path, body=body or {})


def _put(path, body=None):
    return client.put(path, body=body or {})


def _resolve_project(project_ref):
    """Resolve through compat layer so control-plane-backed builds still work."""
    try:
        code, project = compat.project_show(project_ref)
        if code == 200:
            return project, None
    except DaemonError:
        pass

    return {
        "id": project_ref,
        "slug": project_ref,
        "name": project_ref,
        "compat": True,
    }, None


def _fetch_operator_context():
    # Preferred modern package endpoint.
    code, data = _get("/api/context/operator/package")
    if code == 200:
        return data

    # Fallback: operator status / control plane snapshot from current daemon.
    code, data = _get("/api/surfaces/operator-status")
    if code == 200:
        return {
            "subject": {"kind": "operator", "id": "operator", "title": "Operator Context"},
            "summary": {
                "one_line": data.get("summary") or data.get("status") or "operator status available",
                "recommended_next_step": data.get("next_step"),
            },
            "host_truth": data,
            "compat": True,
        }

    code, data = _get("/api/control-plane")
    if code == 200:
        return {
            "subject": {"kind": "operator", "id": "operator", "title": "Operator Context"},
            "summary": {
                "one_line": "control-plane status available",
                "recommended_next_step": None,
            },
            "host_truth": data,
            "compat": True,
        }
    return None


def _fetch_project_context(project_id):
    # Preferred modern package endpoint.
    code, data = _get(f"/api/context/project/{project_id}/package")
    if code == 200:
        return data

    # Fallback for current daemon.
    code, data = _get("/api/control-plane/context_for", params={"project": project_id})
    if code == 200:
        return {
            "subject": {"kind": "project", "id": project_id, "title": project_id},
            "summary": {
                "one_line": data.get("summary") or f"project context for {project_id}",
                "recommended_next_step": data.get("next_step"),
            },
            "project": data,
            "compat": True,
        }
    return None


def _fetch_pending_tasks(project_id=None, limit=10):
    try:
        _code, tasks = compat.tasks_list(project=project_id, status="pending", limit=limit)
        return tasks
    except DaemonError:
        return []


def _fetch_running_agents(limit=10):
    try:
        _code, execs = compat.executions_list(status="running", limit=limit)
        return execs
    except DaemonError:
        pass

    code, data = _get("/api/control-plane/live", params={"limit": limit})
    if code == 200:
        live = data.get("events", data.get("data", data if isinstance(data, list) else []))
        if isinstance(live, list):
            return [
                {
                    "agent_id": e.get("agent") or e.get("agent_id") or "unknown",
                    "task_id": e.get("task_id") or e.get("proposal_id") or "—",
                    "status": e.get("status") or "live",
                }
                for e in live
            ]
    return []


def _task_create(title, project_id=None, description=None, priority=None, agent_id=None):
    body = {"title": title}
    if project_id:
        body["project_id"] = project_id
    if description:
        body["description"] = description
    if priority:
        body["priority"] = int(priority)
    if agent_id:
        body["agent_id"] = agent_id
    return _post("/api/tasks", body=body)


def _task_get(task_id):
    return _get(f"/api/tasks/{task_id}")


def _task_update(task_id, **fields):
    return _put(f"/api/tasks/{task_id}", body={k: v for k, v in fields.items() if v is not None})


def _proposal_create(project_id, intent, summary, agent_id=None, title=None, description=None):
    body = {
        "project": project_id,
        "intent": intent,
        "summary": summary,
        "context": {
            "source": "ema-work",
            "agent_id": agent_id,
            "title": title,
            "description": description,
        },
        "metadata": {"source": "ema-work"},
    }
    return _post("/api/control-plane/proposals", body=body)


def _proposal_run(proposal_id, agent_id=None):
    body = {
        "adapter": "local",
        "operator": agent_id or "ema-work",
        "metadata": {"source": "ema-work"},
    }
    return _post(f"/api/control-plane/proposals/{proposal_id}/run", body=body)


def _execution_complete(execution_id, status="succeeded", summary=None, details=None):
    return _post(
        f"/api/control-plane/executions/{execution_id}/complete",
        body={
            "status": status,
            "summary": summary,
            "details": details or {},
            "metadata": {"source": "ema-work"},
        },
    )


def _execution_dispatch_update(execution_id, status="failed", summary=None, result=None):
    return _post(
        f"/api/control-plane/executions/{execution_id}/dispatch-update",
        body={
            "status": status,
            "summary": summary or "ema work sync update",
            "result": result or {"source": "ema-work"},
        },
    )


def _one_line_summary(pkg):
    summary = (pkg or {}).get("summary", {})
    return summary.get("one_line") or summary.get("recommended_next_step") or "(none)"


def _render_work_packet(packet):
    print()
    print(c("  EMA Work Packet", BOLD + CYAN))
    print()
    subject = packet.get("subject", {})
    print(f"  Mode            {packet.get('mode', 'unknown')}")
    print(f"  Project         {subject.get('project_name', '—')} ({subject.get('project_id', '—')})")
    print(f"  Task            {subject.get('task_title', '—')} ({subject.get('task_id', '—')})")
    if subject.get('proposal_id'):
        print(f"  Proposal        {subject.get('proposal_id')}")
    if subject.get('execution_id'):
        print(f"  Execution       {subject.get('execution_id')}")
    print(f"  Agent           {subject.get('agent_id', 'unassigned')}")
    print()
    print(c("  Operator summary", GOLD))
    print(f"    {_one_line_summary(packet.get('operator_context'))}")
    print(c("  Project summary", GOLD))
    print(f"    {_one_line_summary(packet.get('project_context'))}")
    pending = packet.get("pending_tasks", [])
    running = packet.get("running_agents", [])
    if pending:
        print()
        print(c(f"  Pending tasks ({len(pending)})", GOLD))
        for t in pending[:5]:
            print(f"    • {t.get('id', '?')} | {t.get('title', 'Untitled')} [{t.get('status', 'unknown')}]")
    if running:
        print()
        print(c(f"  Running agents ({len(running)})", GOLD))
        for e in running[:5]:
            print(f"    • {e.get('agent_id', '?')} | {e.get('task_id', '—')} [{e.get('status', 'unknown')}]")
    print()
    print(c("  Recommended agent loop", GOLD))
    print("    1. read operator + project context")
    print("    2. inspect nearby pending tasks / active agents")
    print("    3. work against the bound task")
    print("    4. update task status as reality changes")
    print("    5. leave the ledger better than you found it")
    print()


def cmd_work_start(args, json_out=False):
    pos = args.pos
    title = pos[2] if len(pos) >= 3 else args.get("title")
    if not title and not args.get("task"):
        print_error('Usage: ema work start "<title>" [--project <id|slug>] [--task <id>] [--agent <id>]')
        return 1

    project_ref = args.get("project") or args.get("project-id") or args.get("project_id")
    task_id = args.get("task") or args.get("task-id")
    agent_id = args.get("agent") or args.get("agent-id") or args.get("agent_id")
    priority = args.get("priority")
    description = args.get("description")

    try:
        operator_context = _fetch_operator_context()
        project = None
        if project_ref:
            project, err = _resolve_project(project_ref)
            if err:
                print_error(err.get("error", err.get("message", "Could not resolve project")))
                return 1
            if not project:
                print_error(f"Project not found: {project_ref}")
                return 1
        project_id = project.get("id") if project else None
        project_context = _fetch_project_context(project_id) if project_id else None
        pending_tasks = _fetch_pending_tasks(project_id=project_id)
        running_agents = _fetch_running_agents()

        created = False
        compat_mode = False
        task = None
        proposal = None
        execution = None
        if task_id:
            code, data = _task_get(task_id)
            if code != 200:
                print_error(data.get("error", data.get("message", f"Task {task_id} not found")))
                return 1
            task = data.get("task", data.get("data", data))
        else:
            code, data = _task_create(title=title, project_id=project_id, description=description, priority=priority, agent_id=agent_id)
            if code in (200, 201):
                task = data.get("task", data.get("data", {}))
                task_id = task.get("id")
                created = True
            else:
                compat_mode = True
                intent = (args.get("intent") or title or "agent-work").strip().lower().replace(" ", "-")[:64]
                summary = title or args.get("summary") or "agent work"
                p_code, p_data = _proposal_create(
                    project_id=project_id or (project_ref or "default"),
                    intent=intent,
                    summary=summary,
                    agent_id=agent_id,
                    title=title,
                    description=description,
                )
                if p_code not in (200, 201):
                    print_error(p_data.get("error", p_data.get("message", f"Error {p_code}")))
                    return 1
                proposal = p_data.get("proposal", p_data)
                r_code, r_data = _proposal_run(proposal.get("id"), agent_id=agent_id)
                if r_code == 200:
                    execution = r_data.get("execution", r_data.get("result", r_data))
                task = {
                    "id": proposal.get("id"),
                    "title": title,
                    "status": args.get("status", "in_progress"),
                    "agent_id": agent_id,
                    "project_id": project_id,
                    "description": description,
                }

        if task_id and not compat_mode:
            update = {"status": args.get("status", "in_progress")}
            if agent_id:
                update["agent_id"] = agent_id
            _task_update(task_id, **update)
            code, data = _task_get(task_id)
            if code == 200:
                task = data.get("task", data.get("data", data))

    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    packet = {
        "mode": "work-start",
        "subject": {
            "project_id": (project or {}).get("id"),
            "project_name": (project or {}).get("name") or (project or {}).get("slug"),
            "task_id": task.get("id") if task else None,
            "task_title": task.get("title") if task else title,
            "proposal_id": (proposal or {}).get("id") if 'proposal' in locals() and proposal else None,
            "execution_id": (execution or {}).get("id") if 'execution' in locals() and execution else None,
            "agent_id": agent_id,
        },
        "operator_context": operator_context,
        "project_context": project_context,
        "pending_tasks": pending_tasks,
        "running_agents": running_agents,
    }

    if json_out or args.has("json") or args.has("j"):
        print_json(packet)
    else:
        if created:
            print_created(task.get("id", "?"), "task")
        elif packet['subject'].get('proposal_id'):
            print_success(f"Created proposal {packet['subject'].get('proposal_id')}")
            if packet['subject'].get('execution_id'):
                print_success(f"Registered execution {packet['subject'].get('execution_id')}")
            print_warn("Task CRUD unavailable; using control-plane proposal/execution lineage")
        elif task.get("id"):
            print_success(f"Bound existing task {task.get('id', '?')}")
        else:
            print_warn("Emitting compatibility work packet only")
        if agent_id:
            print_info(f"Agent ownership set to {c(agent_id, GREEN)}")
        _render_work_packet(packet)
    return 0


def cmd_work_sync(args, json_out=False):
    pos = args.pos
    if len(pos) < 3:
        print_error("Usage: ema work sync <task_or_execution_id> [--status <s>] [--agent <id>] [--note <text>]")
        return 1
    work_id = pos[2]
    status = args.get("status")
    agent_id = args.get("agent") or args.get("agent-id")
    note = args.get("note")

    if not any([status, agent_id, note]):
        print_error("Nothing to sync. Provide --status, --agent, or --note")
        return 1

    try:
        if str(work_id).startswith("exe_"):
            normalized = (status or "").lower() if status else ""
            if normalized in ("done", "completed", "succeeded", "success"):
                code, data = _execution_complete(work_id, status="succeeded", summary=note or "ema work sync complete")
            elif normalized in ("failed", "error", "timed_out", "timeout", "blocked"):
                code, data = _execution_dispatch_update(
                    work_id,
                    status="failed",
                    summary=note or f"ema work sync marked {normalized}",
                    result={"agent_id": agent_id, "source": "ema-work", "reported_status": normalized},
                )
            else:
                if json_out or args.has("json") or args.has("j"):
                    print_json({
                        "execution_id": work_id,
                        "status": normalized or "unchanged",
                        "note": note,
                        "warning": "non-terminal execution sync is not yet persisted on this daemon build",
                    })
                else:
                    print_warn("Non-terminal execution sync is not yet persisted on this daemon build")
                    if note:
                        print_info(f"Note: {note}")
                return 0
        else:
            body = {}
            if status:
                body["status"] = status
            if agent_id:
                body["agent_id"] = agent_id
            if note:
                body["description"] = note
            code, data = _task_update(work_id, **body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        print_success(f"Synced {work_id}")
        if str(work_id).startswith("exe_"):
            print_info(f"Execution status: {status or 'updated'}")
        else:
            task = data.get("task", data.get("data", data))
            print_info(f"Status: {task.get('status', 'unknown')}")
            if task.get("agent_id"):
                print_info(f"Agent:  {task.get('agent_id')}")
    return 0


def cmd_work_packet(args, json_out=False):
    project_ref = args.get("project") or args.get("project-id") or args.get("project_id")
    task_id = args.get("task") or args.get("task-id")
    agent_id = args.get("agent") or args.get("agent-id") or args.get("agent_id")

    try:
        operator_context = _fetch_operator_context()
        project = None
        if project_ref:
            project, err = _resolve_project(project_ref)
            if err:
                print_error(err.get("error", err.get("message", "Could not resolve project")))
                return 1
            if not project:
                print_error(f"Project not found: {project_ref}")
                return 1
        project_id = project.get("id") if project else None
        project_context = _fetch_project_context(project_id) if project_id else None
        pending_tasks = _fetch_pending_tasks(project_id=project_id)
        running_agents = _fetch_running_agents()
        task = None
        execution = None
        if task_id:
            if str(task_id).startswith("exe_"):
                _code, execution = compat.execution_show(task_id)
            else:
                code, data = _task_get(task_id)
                if code == 200:
                    task = data.get("task", data.get("data", data))
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    packet = {
        "mode": "work-packet",
        "subject": {
            "project_id": (project or {}).get("id"),
            "project_name": (project or {}).get("name") or (project or {}).get("slug"),
            "task_id": task.get("id") if task else (None if execution else task_id),
            "task_title": task.get("title") if task else None,
            "execution_id": execution.get("id") if execution else (task_id if str(task_id).startswith('exe_') else None),
            "agent_id": agent_id,
        },
        "operator_context": operator_context,
        "project_context": project_context,
        "pending_tasks": pending_tasks,
        "running_agents": running_agents,
    }

    if json_out or args.has("json") or args.has("j"):
        print_json(packet)
    else:
        _render_work_packet(packet)
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_work_help()
        return 0

    sub = pos[1]
    dispatch = {
        "start": cmd_work_start,
        "sync": cmd_work_sync,
        "packet": cmd_work_packet,
    }
    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown work subcommand: {sub}")
        _print_work_help()
        return 1
    return handler(args, json_out=json_out)


def _print_work_help():
    print(c("\n  ema work — Agent work coordination", BOLD + CYAN))
    print()
    cmds = [
        ("start", '"<title>" [--project <id|slug>] [--task <id>] [--agent <id>] [--priority <1-5>] [--intent <intent>]'),
        ("sync",  '<task_or_execution_id> [--status <s>] [--agent <id>] [--note <text>]'),
        ("packet", '[--project <id|slug>] [--task <id|exe_id>] [--agent <id>]'),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema work ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Purpose: help agents begin work through EMA instead of outside it.", GOLD))
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
