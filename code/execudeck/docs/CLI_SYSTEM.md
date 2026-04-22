# CLI System: The Generative Intelligence Surface

The terminal is a React-based shell (utilizing Tambo-style logic) for high-fidelity generative UI.

## 1. Grammar & Prefixes
- `> `: Narrative / Explanation.
- `@AgentName `: Direct Delegation / Hand-off.
- `# `: Status / System updates (e.g., tool calls).
- `! `: Caution / Meta / Hint.
- `/cmd `: Explicit system commands (e.g., `/view A1`, `/split`).

## 2. Interactive Output Blocks (MVP Registry)
The terminal renders the following interactive blocks:
1. **ChoiceList**: Keyboard-navigable selection (Arrow keys + Enter).
2. **FormBlock**: Single or multi-input field for specific parameters.
3. **TableBlock**: Structured data visualization within the CLI transcript.
4. **ProgressBlock**: Animated status/loading indicator for long-running agent tasks.
5. **LinkToken**: Inline clickable reference (e.g., `[TAB: A1]`) that handles navigation.

## 3. Layout: The Vertical Split
When triggered by a system meta-operation (e.g., `/page new` or an MD proposal):
- The central canvas divides into a 50/50 **Vertical Split**.
- **Left Pane**: The active Terminal transcript.
- **Right Pane**: The live GUI preview or the target Page artifact.
- Both panes remain fully interactive. Resizing is handled via CSS Grid/Flexbox.

## 4. Multi-Directional Delegation
- **Non-Hierarchical**: A specialist agent can delegate back to the Governor (EM) for clarifying high-level intent.
- **Forking**: An agent can fork a mission into multiple parallel specialist tabs. Interacting with one tab updates the parent context accordingly.
- **Lineage Visualization**: Block-character graphs in the CLI stream show the "Chain of Thought" and "Chain of Delegation."
