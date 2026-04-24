-record(actor, {
    id :: binary(),
    display_name :: binary(),
    kind :: ema_swarm_coordination@first_boot:actor_kind(),
    role :: binary()
}).
