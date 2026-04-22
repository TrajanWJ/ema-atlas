"""
Output formatters: JSON, Table, Tree, Summary.
Uses only stdlib — no dependencies.
"""
import json
import sys
import shutil

# ANSI color codes
RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RED    = "\033[31m"
GREEN  = "\033[32m"
YELLOW = "\033[33m"
BLUE   = "\033[34m"
MAGENTA= "\033[35m"
CYAN   = "\033[36m"
WHITE  = "\033[37m"
GOLD   = "\033[38;5;214m"
GREY   = "\033[38;5;245m"

_NO_COLOR = not sys.stdout.isatty()


def c(text, *codes):
    if _NO_COLOR:
        return str(text)
    return "".join(codes) + str(text) + RESET


def terminal_width():
    return shutil.get_terminal_size((100, 40)).columns


# ---------------------------------------------------------------------------
# JSON output
# ---------------------------------------------------------------------------

def print_json(data):
    print(json.dumps(data, indent=2, default=str))


# ---------------------------------------------------------------------------
# Table output
# ---------------------------------------------------------------------------

def _cell(val, width, align="left"):
    s = str(val) if val is not None else ""
    if len(s) > width:
        s = s[:width - 1] + "…"
    if align == "right":
        return s.rjust(width)
    return s.ljust(width)


def print_table(rows, columns, title=None):
    """columns: list of (key, header, width, align?)"""
    if not rows:
        print(c("  (no results)", GREY))
        return

    term_w = terminal_width()
    col_widths = [col[2] for col in columns]

    if title:
        print(c("\n  " + title, BOLD + GOLD))
    header_parts = []
    for i, col in enumerate(columns):
        key, header, width = col[0], col[1], col[2]
        header_parts.append(c(_cell(header, width), BOLD + CYAN))
    print("  " + "  ".join(header_parts))
    print("  " + c("─" * min(sum(col_widths) + 2 * len(columns), term_w - 4), GREY))

    for row in rows:
        parts = []
        for col in columns:
            key, header, width = col[0], col[1], col[2]
            align = col[3] if len(col) > 3 else "left"
            val = row.get(key, "")
            colored = _colorize_value(key, val, width)
            parts.append(colored)
        print("  " + "  ".join(parts))
    print()


def _colorize_value(key, val, width):
    s = str(val) if val is not None else ""
    if len(s) > width:
        s = s[:width - 1] + "…"

    if key == "status":
        color_map = {
            "active": GREEN, "completed": CYAN, "done": CYAN, "approved": GREEN,
            "running": GREEN, "open": YELLOW, "resolved": GREY, "killed": RED,
            "redirected": MAGENTA, "error": RED, "queued": BLUE, "in_progress": YELLOW,
            "paused": YELLOW, "proposed": DIM, "draft": DIM, "scored": CYAN,
        }
        color = color_map.get(str(val).lower(), RESET)
        return c(s.ljust(width), color)
    if key == "severity":
        sev = int(val) if str(val).isdigit() else 0
        color = [RESET, GREEN, CYAN, YELLOW, RED, RED + BOLD][min(sev, 5)]
        return c(s.ljust(width), color)
    if key == "healthy":
        color = GREEN if val else RED
        return c(s.ljust(width), color)
    if key in ("cost_usd", "total_cost_usd", "estimated_cost_usd"):
        return c(s.rjust(width), YELLOW)
    if key in ("confidence", "quality_score", "balanced_score"):
        try:
            fval = float(val)
            color = GREEN if fval >= 0.7 else YELLOW if fval >= 0.5 else RED
        except Exception:
            color = RESET
        return c(s.ljust(width), color)
    if key in ("idea_score", "prompt_quality_score"):
        try:
            ival = int(val)
            color = GREEN if ival >= 8 else YELLOW if ival >= 5 else RED
        except Exception:
            color = RESET
        return c(s.ljust(width), color)
    return s.ljust(width)


# ---------------------------------------------------------------------------
# Tree output
# ---------------------------------------------------------------------------

def print_tree(nodes, id_field="id", parent_field="parent_id",
               title_field="title", extra_fields=None, title=None):
    if not nodes:
        print(c("  (empty tree)", GREY))
        return

    if title:
        print(c("\n  " + title, BOLD + GOLD))

    by_id = {n[id_field]: n for n in nodes}
    children = {n[id_field]: [] for n in nodes}
    roots = []
    for n in nodes:
        pid = n.get(parent_field)
        if pid and pid in children:
            children[pid].append(n[id_field])
        else:
            roots.append(n[id_field])

    def render(node_id, prefix, is_last):
        node = by_id[node_id]
        connector = "└── " if is_last else "├── "
        ext = prefix + connector

        label = node.get(title_field, node_id)
        node_id_str = c(" [" + node_id + "]", GREY)
        level = node.get("level")
        level_name = node.get("level_name", "")
        status = node.get("status", "")

        level_str = ""
        if level is not None:
            level_str = c(" L" + str(level) + ":" + level_name, CYAN)
        status_color = GREEN if status == "complete" else YELLOW if status == "partial" else DIM
        status_str = c(" (" + status + ")", status_color)

        extra = ""
        if extra_fields:
            parts = []
            for ef in extra_fields:
                v = node.get(ef)
                if v:
                    parts.append(ef + "=" + str(v))
            if parts:
                extra = c("  " + ", ".join(parts), GREY)

        print("  " + ext + c(label, BOLD) + level_str + status_str + node_id_str + extra)

        kids = children.get(node_id, [])
        child_prefix = prefix + ("    " if is_last else "│   ")
        for i, kid_id in enumerate(kids):
            render(kid_id, child_prefix, i == len(kids) - 1)

    for i, root_id in enumerate(roots):
        render(root_id, "", i == len(roots) - 1)
    print()


def print_proposal_genealogy(lineage, title=None):
    if title:
        print(c("\n  " + title, BOLD + GOLD))
    for i, item in enumerate(lineage):
        is_last = i == len(lineage) - 1
        icon_map = {"seed": "🌱", "proposal": "📋"}
        icon = icon_map.get(item.get("type", ""), "◆")
        label = item.get("title") or item.get("name", item.get("id"))
        id_str = c(" [" + str(item.get("id")) + "]", GREY)
        status = item.get("status", "")
        gen = item.get("generation")
        gen_str = c(" gen=" + str(gen), CYAN) if gen else ""
        status_str = c(" " + status, YELLOW if status in ("queued", "scored") else GREY)

        print("  " + icon + " " + c(label, BOLD) + gen_str + status_str + id_str)
        if not is_last:
            print("  │")
            print("  ▼")
    print()


# ---------------------------------------------------------------------------
# Summary output
# ---------------------------------------------------------------------------

def print_token_summary(data):
    total_cost = data.get("total_cost_usd", 0)
    forecast = data.get("forecast_7d_usd", 0)
    total_in = data.get("total_input_tokens", 0)
    total_out = data.get("total_output_tokens", 0)
    spike = data.get("spike_detected", False)

    print(c("\n  ┌─ Token Usage Summary ─────────────────────────────────────┐", GOLD))
    print("  │  Total cost:     " + c("$" + f"{total_cost:.4f}", YELLOW + BOLD))
    print("  │  Input tokens:   " + c(str(total_in), CYAN))
    print("  │  Output tokens:  " + c(str(total_out), CYAN))
    print("  │  7-day forecast: " + c("$" + f"{forecast:.2f}", YELLOW))
    spike_str = c("⚠️  YES", RED + BOLD) if spike else c("✓  No", GREEN)
    print("  │  Spike detected: " + spike_str)
    print(c("  ├─ By Model ─────────────────────────────────────────────────┤", GOLD))
    for model, info in data.get("by_model", {}).items():
        cost_val = info.get("cost_usd", 0)
        calls_val = info.get("calls", 0)
        cost_str = c("$" + f"{cost_val:.4f}", YELLOW)
        calls_str = c(str(calls_val), CYAN)
        print("  │  " + f"{model:<10} " + cost_str + " " * 10 + calls_str + " calls")
    if data.get("daily_spend"):
        print(c("  ├─ Daily Spend (last 7 days) ───────────────────────────────┤", GOLD))
        for entry in data["daily_spend"][-7:]:
            cost_val = entry.get("cost_usd", 0)
            bar_len = int(cost_val * 20)
            bar = "█" * min(bar_len, 40)
            date_str = entry.get("date", "")
            print("  │  " + date_str + "  " + c(bar, YELLOW) + " " * max(0, 40 - bar_len) + " " + c("$" + f"{cost_val:.4f}", YELLOW))
    print(c("  └───────────────────────────────────────────────────────────┘", GOLD))
    print()


def print_project_health(project, stats):
    pid = project["id"]
    name = project["name"]
    status = project["status"]
    color = GREEN if status == "active" else YELLOW
    score = stats.get("health_score", 0)

    print(c("\n  ┌─ Project Health: " + name + " [" + pid + "] ─────────────────────────┐", GOLD))
    print("  │  Status:      " + c(status, color))
    print("  │  Path:        " + c(project.get("linked_path", "N/A"), CYAN))
    print("  │  Proposals:   " + c(str(stats.get("proposals", 0)), CYAN))
    print("  │  Tasks:       " + c(str(stats.get("tasks", 0)), CYAN))
    print("  │  Open Gaps:   " + c(str(stats.get("gaps_open", 0)), YELLOW))
    print("  │  Sessions:    " + c(str(stats.get("sessions", 0)), CYAN))
    bar_len = int(score * 30)
    bar_color = GREEN if score > 0.7 else YELLOW if score > 0.4 else RED
    bar = c("█" * bar_len + "░" * (30 - bar_len), bar_color)
    pct = f"{score:.0%}"
    print("  │  Health:      " + bar + " " + c(pct, bar_color + BOLD))
    print(c("  └───────────────────────────────────────────────────────────┘", GOLD))
    print()


# ---------------------------------------------------------------------------
# Misc helpers
# ---------------------------------------------------------------------------

def print_success(msg):
    print(c("  ✓ " + msg, GREEN), file=sys.stderr)

def print_error(msg):
    print(c("  ✗ " + msg, RED), file=sys.stderr)

def print_warn(msg):
    print(c("  ⚠ " + msg, YELLOW), file=sys.stderr)

def print_info(msg):
    print(c("  · " + msg, CYAN), file=sys.stderr)

def print_created(id_val, kind=""):
    label = kind + " " if kind else ""
    print(c("  ✓ Created " + label, GREEN) + c(id_val, GOLD + BOLD), file=sys.stderr)

def print_header(text):
    w = min(terminal_width() - 4, 60)
    print(c("\n  " + "─" * w, GREY), file=sys.stderr)
    print(c("  " + text, BOLD + GOLD), file=sys.stderr)
    print(c("  " + "─" * w, GREY), file=sys.stderr)


# ---------------------------------------------------------------------------
# Intent tree rendering
# ---------------------------------------------------------------------------

def print_intent_tree(tree, indent=0):
    """Render intent nodes as nested tree."""
    def render_node(node, prefix="", is_last=True):
        level = node.get("level", 0)
        level_names = ["product", "flow", "action", "system", "implementation"]
        level_name = level_names[level] if level < len(level_names) else "?"
        title = node.get("title", "Untitled")
        node_id = node.get("id", "")
        status = node.get("status", "")
        
        indent_str = " " * indent
        connector = "└─ " if is_last else "├─ "
        print(f"{indent_str}{connector}{level_name[0].upper()} {title} [{node_id}] {status}")
        
        children = node.get("children", [])
        for i, child in enumerate(children):
            is_last_child = (i == len(children) - 1)
            render_node(child, prefix, is_last_child)
    
    for i, node in enumerate(tree):
        is_last = (i == len(tree) - 1)
        render_node(node, is_last=is_last)
    print()


def print_genealogy_tree(genealogy, indent=0):
    """Render proposal genealogy as tree."""
    def render_prop(prop, prefix="", is_last=True, depth=0):
        prop_id = prop.get("id", "")
        status = prop.get("status", "")
        seed = prop.get("seed_source", "")
        
        indent_str = " " * indent
        connector = "└─ " if is_last else "├─ "
        seed_str = f"[{seed}]" if seed else ""
        print(f"{indent_str}{connector}📋 gen={depth} {prop_id} {status} {seed_str}")
        
        children = prop.get("children", [])
        for i, child in enumerate(children):
            is_last_child = (i == len(children) - 1)
            render_prop(child, prefix, is_last_child, depth + 1)
    
    root = genealogy.get("root", {})
    if root:
        render_prop(root, is_last=True, depth=0)
    print()

