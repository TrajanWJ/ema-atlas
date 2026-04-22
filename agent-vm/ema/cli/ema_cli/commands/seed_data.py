"""
Seed the store with realistic test data across all collections.
"""
from .. import store, fixtures


def seed_all(num_projects: int = 2, verbose: bool = True) -> dict:
    """Seed all collections with realistic fixture data. Returns summary."""
    counts = {}

    # Projects
    projects = []
    for i in range(num_projects):
        p = fixtures.make_project()
        p["id"] = f"pro_ema{i:04d}"  # predictable IDs
        store.put("projects", p)
        projects.append(p)
    counts["projects"] = len(projects)

    # Intent trees (one per project)
    all_intent_nodes = []
    for p in projects:
        tree = fixtures.make_intent_tree(p["id"])
        # Add extra nodes at each level for breadth
        for level in range(1, 5):
            extra = fixtures.make_intent_node(p["id"], level=level,
                                               parent_id=tree[level - 1]["id"])
            tree.append(extra)
        for node in tree:
            store.put("intent_nodes", node)
        all_intent_nodes.extend(tree)
        # Create some edges
        if len(tree) >= 3:
            for i in range(min(4, len(tree) - 1)):
                edge = fixtures.make_intent_edge(tree[i]["id"], tree[i + 1]["id"])
                store.put("intent_edges", edge)
    counts["intent_nodes"] = len(all_intent_nodes)

    # Gaps (5-8 per project)
    for p in projects:
        for _ in range(6):
            g = fixtures.make_gap(p["id"])
            store.put("gaps", g)
    counts["gaps"] = sum(1 for _ in store.all_items("gaps"))

    # Seeds (3 per project)
    for p in projects:
        for _ in range(3):
            s = fixtures.make_seed(p["id"])
            store.put("seeds", s)
    counts["seeds"] = sum(1 for _ in store.all_items("seeds"))

    # Proposals (8-10 per project, some with parent chains)
    all_proposals = []
    statuses = ["draft", "refined", "debated", "scored", "queued", "approved",
                "redirected", "killed", "queued", "scored"]
    seeds = store.all_items("seeds")
    for p in projects:
        proj_seeds = [s for s in seeds if s.get("project_id") == p["id"]]
        seed_id = proj_seeds[0]["id"] if proj_seeds else None
        parent_id = None
        for i, st in enumerate(statuses):
            prop = fixtures.make_proposal(p["id"], seed_id=seed_id,
                                           parent_proposal_id=parent_id, status=st)
            store.put("proposals", prop)
            all_proposals.append(prop)
            # Create a redirect chain for first 3
            if i < 3 and st == "redirected":
                parent_id = prop["id"]
            else:
                parent_id = None
    counts["proposals"] = len(all_proposals)

    # Tasks (6-8 per project)
    for p in projects:
        proj_props = [pr for pr in all_proposals if pr.get("project_id") == p["id"]
                      and pr.get("status") == "approved"]
        for i in range(7):
            src_type = "proposal" if i < len(proj_props) else "manual"
            src_id = proj_props[i]["id"] if src_type == "proposal" else None
            t = fixtures.make_task(p["id"], source_type=src_type, source_id=src_id)
            store.put("tasks", t)
    counts["tasks"] = sum(1 for _ in store.all_items("tasks"))

    # AI Sessions (4 per project)
    for p in projects:
        for _ in range(4):
            sess = fixtures.make_ai_session(project_path=p.get("linked_path", ""))
            store.put("ai_sessions", sess)
            # Add messages to each session
            msgs = fixtures.make_session_messages(sess["id"], count=random.choice([4, 6, 8]))
            for m in msgs:
                store.put("ai_session_messages", m)
    counts["ai_sessions"] = sum(1 for _ in store.all_items("ai_sessions"))
    counts["ai_session_messages"] = sum(1 for _ in store.all_items("ai_session_messages"))

    # Token events (30 events across models)
    for p in projects:
        for _ in range(15):
            te = fixtures.make_token_event(p["id"])
            store.put("token_events", te)
    counts["token_events"] = sum(1 for _ in store.all_items("token_events"))

    return counts


import random
