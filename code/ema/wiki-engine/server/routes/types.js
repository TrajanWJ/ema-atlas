const { Hono } = require('hono');

const router = new Hono();

const PAGE_TYPES = {
  knowledge: {
    description: 'General knowledge, notes, learnings',
    fields: {
      summary: { type: 'string', required: false },
      source: { type: 'string', required: false },
      confidence: { type: 'float', required: false },
    }
  },
  project: {
    description: 'Project pages with status tracking',
    fields: {
      status: { type: 'enum', values: ['planning', 'active', 'paused', 'archived'], required: true },
      github_repo: { type: 'string', required: false },
      deploy_url: { type: 'string', required: false },
      start_date: { type: 'date', required: false },
      target_date: { type: 'date', required: false },
      stack: { type: 'array', items: 'string', required: false },
    }
  },
  intent: {
    description: 'Superman intent files — project objectives and context for agents',
    fields: {
      objective: { type: 'text', required: false },
      constraints: { type: 'text', required: false },
      success_criteria: { type: 'text', required: false },
      current_state: { type: 'text', required: false },
      next_milestone: { type: 'text', required: false },
      agent_context: { type: 'text', required: false },
    }
  },
  task: {
    description: 'Actionable tasks with status and priority',
    fields: {
      status: { type: 'enum', values: ['open', 'in_progress', 'blocked', 'done', 'cancelled'], required: false },
      priority: { type: 'enum', values: ['low', 'medium', 'high', 'urgent'], required: false },
      assignee: { type: 'string', required: false },
      due_date: { type: 'date', required: false },
    }
  },
  config: {
    description: 'System and project configuration pages',
    fields: {
      scope: { type: 'enum', values: ['global', 'space', 'project'], required: false },
      config_data: { type: 'json', required: false },
    }
  },
  research: {
    description: 'Research findings and analysis',
    fields: {
      query: { type: 'text', required: false },
      depth: { type: 'enum', values: ['shallow', 'deep', 'recursive'], required: false },
      status: { type: 'enum', values: ['running', 'complete', 'stale'], required: false },
      findings: { type: 'text', required: false },
    }
  },
  codebase: {
    description: 'Codebase documentation and metadata',
    fields: {
      repo_url: { type: 'string', required: false },
      stack: { type: 'array', items: 'string', required: false },
      host: { type: 'string', required: false },
      status: { type: 'enum', values: ['active', 'archived', 'legacy'], required: false },
    }
  },
  sprint: {
    description: 'Weekly sprint logs',
    fields: {
      week: { type: 'string', required: false },
      goals: { type: 'array', items: 'string', required: false },
      completed: { type: 'array', items: 'string', required: false },
      blockers: { type: 'array', items: 'string', required: false },
    }
  },
  meeting: {
    description: 'Meeting notes and daily logs',
    fields: {
      date: { type: 'date', required: false },
      attendees: { type: 'array', items: 'string', required: false },
      agenda: { type: 'text', required: false },
      notes: { type: 'text', required: false },
      actions: { type: 'array', items: 'string', required: false },
    }
  },
  decision: {
    description: 'Architectural and strategic decisions',
    fields: {
      date: { type: 'date', required: false },
      context: { type: 'text', required: false },
      options_considered: { type: 'text', required: false },
      chosen: { type: 'text', required: false },
      rationale: { type: 'text', required: false },
      revisit_date: { type: 'date', required: false },
    }
  },
};

// GET /api/wiki/types
router.get('/', (c) => {
  const types = Object.entries(PAGE_TYPES).map(([name, schema]) => ({
    name,
    description: schema.description,
    fields: Object.keys(schema.fields),
    required_fields: Object.entries(schema.fields)
      .filter(([, v]) => v.required)
      .map(([k]) => k),
  }));
  return c.json({ types });
});

// GET /api/wiki/types/:type/schema
router.get('/:type/schema', (c) => {
  const { type } = c.req.param();
  const schema = PAGE_TYPES[type];
  if (!schema) return c.json({ error: 'Unknown type' }, 404);
  
  return c.json({
    name: type,
    description: schema.description,
    fields: Object.entries(schema.fields).map(([name, def]) => ({
      name,
      ...def,
    })),
  });
});

module.exports = router;
