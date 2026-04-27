# Vision Guardrails

## Frame

EMA is a shared human-agent workspace, not a generic chat app and not a loose bundle of screens. When we plan or ship, we should keep the product shape in view: projects and spaces organize work, wiki holds durable knowledge, chat and threads carry live collaboration, the agent environment executes, HQ coordinates, launchpad starts work, and the virtual desktop is the working surface.

## Keep the shape intact

- Treat `project` and `space` as real semantics, not interchangeable labels.
- Treat `wiki` as durable memory, `chat` as conversation, and `threads` as scoped working context.
- Treat the `agent environment` as the place where actions happen, not a decorative shell.
- Treat `HQ` as the control and coordination layer.
- Treat `launchpad` as the entry point into work, not another generic dashboard.
- Treat the `virtual desktop` as a real workspace metaphor with tools, context, and task continuity.

## Anti-drift rules

- Do not collapse everything into one feed, one inbox, or one dashboard.
- Do not turn project/space into naming sugar for the same object.
- Do not let wiki absorb live chat behavior or let chat become the long-term record.
- Do not design around abstract "AI features" without anchoring them to a concrete EMA surface.
- Do not lose the distinction between human collaboration and agent execution.
- Do not add UI that cannot be explained in one sentence using the product nouns above.

## Orchestrator check

Before changing direction, ask:

1. Which surface does this belong to?
2. Is this project-level, space-level, or thread-level?
3. Does it preserve the split between conversation, memory, and execution?
4. Would a user still understand where to start, where to work, and where to return later?

If the answer blurs those boundaries, the design is drifting.

## Working rule

Prefer the smallest design that still respects the full EMA loop: start in launchpad, work in the virtual desktop, collaborate in chat and threads, persist meaning in wiki, execute through the agent environment, and keep HQ and project/space structure visible enough that the user never loses orientation.
