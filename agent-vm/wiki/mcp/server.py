#!/usr/bin/env python3.12
"""
Wiki MCP Server
Provides structured agent access to the wiki engine at :8091 via MCP stdio protocol.
"""

import json
import sys
from typing import Optional, Any

import httpx
from mcp.server.fastmcp import FastMCP

WIKI_BASE = "http://localhost:8093"

mcp = FastMCP(
    name="wiki",
    instructions=(
        "Wiki MCP server for structured access to the knowledge wiki. "
        "Use wiki_read to fetch pages, wiki_search for discovery, "
        "wiki_create/wiki_update to write, wiki_graph for link analysis, "
        "wiki_list for filtered enumeration, and wiki_context for project briefings."
    ),
)


def _get(path: str, params: Optional[dict] = None) -> Any:
    """Synchronous GET to wiki engine."""
    with httpx.Client(timeout=10.0) as client:
        r = client.get(f"{WIKI_BASE}{path}", params=params)
        r.raise_for_status()
        return r.json()


def _post(path: str, body: dict) -> Any:
    """Synchronous POST to wiki engine."""
    with httpx.Client(timeout=10.0) as client:
        r = client.post(f"{WIKI_BASE}{path}", json=body)
        r.raise_for_status()
        return r.json()


def _put(path: str, body: dict) -> Any:
    """Synchronous PUT to wiki engine."""
    with httpx.Client(timeout=10.0) as client:
        r = client.put(f"{WIKI_BASE}{path}", json=body)
        r.raise_for_status()
        return r.json()


# ============================================================
# Tool: wiki_read
# ============================================================

@mcp.tool()
def wiki_read(page_id: str) -> str:
    """
    Read a wiki page by its ID.

    Returns the full page including frontmatter metadata, markdown content,
    and backlinks (pages that link to this page).

    Args:
        page_id: The page ID (e.g. 'research/ai-safety' or a uuid)
    """
    try:
        page = _get(f"/api/pages/{page_id}")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return f"Error: Page '{page_id}' not found."
        return f"Error fetching page: {e}"
    except Exception as e:
        return f"Error: {e}"

    fm = page.get("frontmatter", {})
    content = page.get("content", "")
    backlinks = page.get("backlinks", [])
    forward_links = page.get("forward_links", [])

    lines = [
        f"# {fm.get('title', page_id)}",
        "",
        "## Frontmatter",
        f"- **ID**: {page.get('id', '')}",
        f"- **Type**: {fm.get('type', '')}",
        f"- **Status**: {fm.get('status', '')}",
        f"- **Project**: {fm.get('project', '')}",
        f"- **Tags**: {', '.join(fm.get('tags') or [])}",
        f"- **Summary**: {fm.get('summary', '')}",
        f"- **Created**: {page.get('created_at', '')}",
        f"- **Updated**: {page.get('updated_at', '')}",
        f"- **Word count**: {page.get('word_count', 0)}",
        "",
        "## Content",
        content or "_No content_",
        "",
        f"## Backlinks ({len(backlinks)})",
    ]
    if backlinks:
        for bl in backlinks:
            lines.append(f"- {bl}")
    else:
        lines.append("_No backlinks_")

    lines += [
        "",
        f"## Forward Links ({len(forward_links)})",
    ]
    if forward_links:
        for fl in forward_links:
            lines.append(f"- {fl}")
    else:
        lines.append("_No forward links_")

    return "\n".join(lines)


# ============================================================
# Tool: wiki_search
# ============================================================

@mcp.tool()
def wiki_search(
    query: str,
    type: Optional[str] = None,
    project: Optional[str] = None,
    limit: int = 20,
) -> str:
    """
    Full-text search across wiki pages.

    Args:
        query: Search terms
        type: Optional page type filter (e.g. 'research', 'intent', 'decision')
        project: Optional project name filter
        limit: Max results to return (default 20)
    """
    try:
        params: dict = {"q": query, "limit": limit}
        results_data = _get("/api/search", params=params)
        results = results_data.get("results", [])
    except Exception as e:
        return f"Error: {e}"

    # Apply client-side filters if needed (search endpoint doesn't support type/project filters)
    if type or project:
        filtered = []
        for r in results:
            # We need to fetch each result to check type/project — expensive.
            # Instead, do a list-based search for type/project and intersect.
            pass
        # Fall back to list-based approach for filtered searches
        try:
            lp: dict = {"limit": 200}
            if type:
                lp["type"] = type
            if project:
                lp["project"] = project
            list_data = _get("/api/pages", params=lp)
            pages = list_data.get("pages", [])
            # Score pages by whether query appears in title or summary
            q_lower = query.lower()
            scored = []
            for p in pages:
                title = (p.get("title") or "").lower()
                summary = (p.get("summary") or "").lower()
                if q_lower in title:
                    scored.append((2, p))
                elif q_lower in summary:
                    scored.append((1, p))
                else:
                    scored.append((0, p))
            scored.sort(key=lambda x: -x[0])
            pages = [p for _, p in scored[:limit]]

            if not pages:
                return f"No pages found matching '{query}'" + (f" (type={type})" if type else "") + (f" (project={project})" if project else "")

            lines = [f"## Search Results for '{query}' ({len(pages)} results)", ""]
            for p in pages:
                lines.append(f"### [{p.get('title', p.get('id'))}]({p.get('id')})")
                lines.append(f"- **Type**: {p.get('type', '')} | **Status**: {p.get('status', '')}")
                if p.get("summary"):
                    lines.append(f"- **Summary**: {p.get('summary')}")
                lines.append("")
            return "\n".join(lines)
        except Exception as e:
            return f"Error in filtered search: {e}"

    if not results:
        return f"No results found for '{query}'."

    lines = [f"## Search Results for '{query}' ({len(results)} results)", ""]
    for r in results[:limit]:
        lines.append(f"### [{r.get('title', r.get('id'))}]({r.get('id')})")
        lines.append(f"- **Type**: {r.get('type', '')} | **Rank**: {r.get('rank', 0):.2f}")
        if r.get("snippet"):
            lines.append(f"> {r.get('snippet')}")
        lines.append("")

    return "\n".join(lines)


# ============================================================
# Tool: wiki_create
# ============================================================

@mcp.tool()
def wiki_create(
    title: str,
    type: str,
    content: str,
    project: Optional[str] = None,
    tags: Optional[list] = None,
) -> str:
    """
    Create a new wiki page.

    Args:
        title: Page title
        type: Page type — one of: project, research, intent, decision, task, codebase,
              config, agent-profile, agent-learning, session-summary, daily-note,
              playbook, integration, synthesis, knowledge, sprint
        content: Markdown body content
        project: Optional project association
        tags: Optional list of tags
    """
    frontmatter: dict = {"title": title, "type": type}
    if project:
        frontmatter["project"] = project
    if tags:
        frontmatter["tags"] = tags

    body = {"frontmatter": frontmatter, "content": content}

    try:
        page = _post("/api/pages", body)
    except httpx.HTTPStatusError as e:
        return f"Error creating page: {e.response.text}"
    except Exception as e:
        return f"Error: {e}"

    return (
        f"Page created successfully.\n"
        f"- **ID**: {page.get('id')}\n"
        f"- **Path**: {page.get('path')}\n"
        f"- **Title**: {page.get('frontmatter', {}).get('title', title)}\n"
        f"- **Type**: {type}\n"
        f"- **Created**: {page.get('created_at')}"
    )


# ============================================================
# Tool: wiki_update
# ============================================================

@mcp.tool()
def wiki_update(
    page_id: str,
    content: Optional[str] = None,
    frontmatter: Optional[dict] = None,
) -> str:
    """
    Update an existing wiki page.

    Args:
        page_id: ID of the page to update
        content: New markdown body content (replaces existing content if provided)
        frontmatter: Dict of frontmatter fields to update (merged with existing)
    """
    if content is None and frontmatter is None:
        return "Error: Must provide at least one of 'content' or 'frontmatter' to update."

    body: dict = {}
    if content is not None:
        body["content"] = content
    if frontmatter is not None:
        body["frontmatter"] = frontmatter

    try:
        page = _put(f"/api/pages/{page_id}", body)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return f"Error: Page '{page_id}' not found."
        return f"Error updating page: {e.response.text}"
    except Exception as e:
        return f"Error: {e}"

    return (
        f"Page updated successfully.\n"
        f"- **ID**: {page.get('id')}\n"
        f"- **Title**: {page.get('frontmatter', {}).get('title', page_id)}\n"
        f"- **Updated**: {page.get('updated_at')}"
    )


# ============================================================
# Tool: wiki_graph
# ============================================================

@mcp.tool()
def wiki_graph(page_id: str) -> str:
    """
    Get the link graph for a wiki page — backlinks and forward links as page summaries.

    Args:
        page_id: The page ID to get the graph for
    """
    try:
        graph = _get(f"/api/graph/{page_id}")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return f"Error: Page '{page_id}' not found."
        return f"Error fetching graph: {e}"
    except Exception as e:
        return f"Error: {e}"

    current = graph.get("page", {})
    backlinks = graph.get("backlinks", [])
    forward_links = graph.get("forward_links", [])

    lines = [
        f"# Link Graph: {current.get('title', page_id)}",
        f"- **ID**: {current.get('id')}",
        f"- **Type**: {current.get('type')}",
        "",
        f"## Backlinks ({len(backlinks)}) — pages linking TO this page",
    ]

    if backlinks:
        for node in backlinks:
            lines.append(f"- **[{node.get('title')}]({node.get('id')})** — `{node.get('type')}`")
    else:
        lines.append("_No backlinks_")

    lines += [
        "",
        f"## Forward Links ({len(forward_links)}) — pages this page links TO",
    ]

    if forward_links:
        for node in forward_links:
            lines.append(f"- **[{node.get('title')}]({node.get('id')})** — `{node.get('type')}`")
    else:
        lines.append("_No forward links_")

    return "\n".join(lines)


# ============================================================
# Tool: wiki_list
# ============================================================

@mcp.tool()
def wiki_list(
    type: Optional[str] = None,
    project: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
) -> str:
    """
    List wiki pages with optional filters.

    Args:
        type: Filter by page type (e.g. 'research', 'intent', 'decision', 'project')
        project: Filter by project name
        status: Filter by status (e.g. 'active', 'draft', 'open', 'in-progress', 'done')
        limit: Max pages to return (default 50)
    """
    params: dict = {"limit": limit}
    if type:
        params["type"] = type
    if project:
        params["project"] = project
    if status:
        params["status"] = status

    try:
        data = _get("/api/pages", params=params)
        pages = data.get("pages", [])
    except Exception as e:
        return f"Error: {e}"

    if not pages:
        desc = []
        if type:
            desc.append(f"type={type}")
        if project:
            desc.append(f"project={project}")
        if status:
            desc.append(f"status={status}")
        return f"No pages found" + (f" ({', '.join(desc)})" if desc else "") + "."

    header_parts = []
    if type:
        header_parts.append(f"type={type}")
    if project:
        header_parts.append(f"project={project}")
    if status:
        header_parts.append(f"status={status}")
    header = f"## Wiki Pages ({len(pages)})" + (f" — {', '.join(header_parts)}" if header_parts else "")

    lines = [header, ""]
    for p in pages:
        title = p.get("title", p.get("id", "?"))
        pid = p.get("id", "")
        ptype = p.get("type", "")
        pstatus = p.get("status", "")
        summary = p.get("summary", "")
        tags = p.get("tags") or []

        status_badge = f" `{pstatus}`" if pstatus else ""
        tag_str = f" — {', '.join(f'#{t}' for t in tags[:3])}" if tags else ""
        lines.append(f"- **[{title}]({pid})** `{ptype}`{status_badge}{tag_str}")
        if summary:
            lines.append(f"  > {summary}")

    return "\n".join(lines)


# ============================================================
# Tool: wiki_context
# ============================================================

@mcp.tool()
def wiki_context(project_id: str) -> str:
    """
    Get a structured context bundle for agent dispatch — Superman-style briefing.

    Assembles: project summary, active intents, recent decisions, related research.
    Use this when spinning up an agent on a project to give it full context fast.

    Args:
        project_id: The project identifier (slug or name used in page frontmatter)
    """
    errors = []

    # 1. Get the project page itself
    project_page = None
    try:
        # Try searching for a project-type page matching this id
        data = _get("/api/pages", params={"type": "project", "project": project_id, "limit": 5})
        pages = data.get("pages", [])
        if pages:
            project_page = pages[0]
        else:
            # Try searching by title match
            search_data = _get("/api/search", params={"q": project_id, "limit": 5})
            for r in search_data.get("results", []):
                if r.get("type") == "project":
                    # Fetch full page
                    try:
                        project_page = _get(f"/api/pages/{r['id']}")
                        project_page = project_page.get("frontmatter", project_page)
                        break
                    except Exception:
                        pass
    except Exception as e:
        errors.append(f"project lookup: {e}")

    # 2. Get intent pages for this project
    intents = []
    try:
        data = _get("/api/pages", params={"type": "intent", "project": project_id, "limit": 50})
        intents = data.get("pages", [])
    except Exception as e:
        errors.append(f"intents lookup: {e}")

    # 3. Get decision pages for this project
    decisions = []
    try:
        data = _get("/api/pages", params={"type": "decision", "project": project_id, "limit": 20})
        decisions = data.get("pages", [])
    except Exception as e:
        errors.append(f"decisions lookup: {e}")

    # 4. Get research pages tagged with this project
    research = []
    try:
        data = _get("/api/pages", params={"type": "research", "project": project_id, "limit": 20})
        research = data.get("pages", [])
        # Also try tags-based search
        if not research:
            data2 = _get("/api/pages", params={"type": "research", "tags": project_id, "limit": 20})
            research = data2.get("pages", [])
    except Exception as e:
        errors.append(f"research lookup: {e}")

    # 5. Also try the dedicated project intents endpoint
    intents_bundle = None
    try:
        intents_bundle = _get(f"/api/projects/{project_id}/intents")
    except Exception:
        pass  # Not critical

    # Build context markdown
    lines = [
        f"# Wiki Context: {project_id}",
        "",
        "## Project Summary",
    ]

    if project_page:
        fm = project_page.get("frontmatter", project_page) if "frontmatter" in project_page else project_page
        summary = fm.get("summary") or project_page.get("summary", "")
        title = fm.get("title") or project_page.get("title", project_id)
        pstatus = fm.get("status") or project_page.get("status", "")
        lines.append(f"**{title}**" + (f" — Status: `{pstatus}`" if pstatus else ""))
        if summary:
            lines.append(f"\n{summary}")
        else:
            lines.append("_No summary available_")
    else:
        lines.append(f"_No project page found for '{project_id}'_")

    lines += ["", "## Active Intents"]

    # Filter to active/open intents
    active_intents = [i for i in intents if i.get("status") in ("active", "open", "in-progress", "planned", None)]
    if not active_intents:
        active_intents = intents  # show all if no status filter matches

    if active_intents:
        for intent in active_intents:
            title = intent.get("title", intent.get("id", "?"))
            status = intent.get("status", "")
            summary = intent.get("summary", "")
            pid = intent.get("id", "")
            status_str = f" `{status}`" if status else ""
            lines.append(f"- **[{title}]({pid})**{status_str}")
            if summary:
                lines.append(f"  > {summary}")
    elif intents_bundle:
        # Use the structured intents from the dedicated endpoint
        bundle_intents = intents_bundle.get("intents", [])
        if bundle_intents:
            for intent in bundle_intents[:20]:
                title = intent.get("title", intent.get("id", "?"))
                status = intent.get("status", "")
                lines.append(f"- **{title}**" + (f" `{status}`" if status else ""))
        else:
            lines.append("_No active intents_")
    else:
        lines.append("_No active intents_")

    lines += ["", "## Recent Decisions"]

    if decisions:
        # Sort by updated_at descending
        decisions_sorted = sorted(decisions, key=lambda d: d.get("updated_at", ""), reverse=True)
        for dec in decisions_sorted[:10]:
            title = dec.get("title", dec.get("id", "?"))
            status = dec.get("status", "")
            summary = dec.get("summary", "")
            pid = dec.get("id", "")
            status_str = f" `{status}`" if status else ""
            lines.append(f"- **[{title}]({pid})**{status_str}")
            if summary:
                lines.append(f"  > {summary}")
    else:
        lines.append("_No decision pages found_")

    lines += ["", "## Related Research"]

    if research:
        for r in research[:10]:
            title = r.get("title", r.get("id", "?"))
            pid = r.get("id", "")
            summary = r.get("summary", "")
            tags = r.get("tags") or []
            tag_str = f" — {', '.join(f'#{t}' for t in tags[:3])}" if tags else ""
            lines.append(f"- **[{title}]({pid})**{tag_str}")
            if summary:
                lines.append(f"  > {summary}")
    else:
        lines.append("_No related research pages_")

    if errors:
        lines += ["", "---", "_Errors during context assembly:_"]
        for err in errors:
            lines.append(f"- {err}")

    return "\n".join(lines)


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    mcp.run(transport="stdio")
