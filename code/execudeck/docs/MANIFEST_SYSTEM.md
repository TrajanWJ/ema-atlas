# Manifest System: Structured Artifacts

ExecuDeck eliminates the fragility of free-form drag-and-drop by using **Structured Schema-Driven Editing**.

## 1. Editing Model
- **Tree View**: Manage nesting, ordering, and grouping of artifacts.
- **Inspector View**: Form-based property editing of specific component nodes.
- **No Manual Code**: All mutations are performed via structured JSON transformations.

## 2. Initial Page Tree State
```text
System
├─ Overview
├─ Agents (Reference IDs: E1, M1)
├─ Pages
│  ├─ Blank Page A (Reference ID: A1)
│  └─ Blank Page B (Reference ID: B1)
└─ History
```

## 3. MVP GUI Component Catalog
The initial registry includes:
1. **Card**: Basic container for grouping information.
2. **DataTable**: Sortable, filterable table for structured data view.
3. **LineChart**: Time-series visualization using a curated charting lib.
4. **NavGroup**: Primitive for creating nested tab/bar hierarchies within a page.
5. **TextElement**: Markdown-supported rich text component.

## 4. Proposal Preview Flow
When MD emits a manifest:
1. View splits **Vertically**.
2. Left: CLI Narrative.
3. Right: GUI rendering of the proposed manifest.
4. **Human Interaction**: User can inspect/preview the proposed GUI components before clicking `Accept`.

## 5. Nesting Guardrails
While the schema supports unlimited nesting, the UI enforces **Practical Visibility**:
- Sidebar displays 3 levels of depth before utilizing drill-down or breadcrumb patterns.
- Structured editor (Tree) remains the source of truth for full hierarchy management.
