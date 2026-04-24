-record(see_agent_work_seed, {
    swarm_name :: binary(),
    weekly_phase :: binary(),
    active_missions :: list(binary()),
    lanes :: list(binary()),
    blocked_work :: list(binary()),
    agent_roles :: list(binary()),
    mocked_controls :: list(binary())
}).
