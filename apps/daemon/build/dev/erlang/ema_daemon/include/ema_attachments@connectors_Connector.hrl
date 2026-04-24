-record(connector, {
    id :: binary(),
    user_id :: binary(),
    provider :: ema_attachments@connectors:provider(),
    status :: ema_attachments@connectors:status(),
    connected_at :: ema_attachments@connectors:option(binary()),
    display_label :: binary(),
    fake :: boolean()
}).
