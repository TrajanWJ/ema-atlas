-record(blueprint_section, {
    id :: binary(),
    document_id :: binary(),
    title :: binary(),
    parent_id :: ema_daemon@event_envelope:option(binary())
}).
