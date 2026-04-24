-record(envelope, {
    event_id :: binary(),
    kind :: binary(),
    ts :: binary(),
    actor :: binary(),
    org_id :: binary(),
    space_id :: ema_daemon@event_envelope:option(binary()),
    project_id :: ema_daemon@event_envelope:option(binary()),
    dispatch_id :: ema_daemon@event_envelope:option(binary()),
    execution_id :: ema_daemon@event_envelope:option(binary()),
    payload_json :: binary()
}).
