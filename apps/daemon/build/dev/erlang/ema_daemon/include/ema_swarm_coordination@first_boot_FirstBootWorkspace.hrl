-record(first_boot_workspace, {
    org :: ema_swarm_coordination@first_boot:organization(),
    default_space :: ema_swarm_coordination@first_boot:space(),
    project :: ema_swarm_coordination@first_boot:project(),
    actors :: list(ema_swarm_coordination@first_boot:actor()),
    blueprint_document :: ema_swarm_coordination@first_boot:blueprint_document(),
    blueprint_sections :: list(ema_swarm_coordination@first_boot:blueprint_section()),
    codebase :: ema_swarm_coordination@first_boot:codebase_record()
}).
