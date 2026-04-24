-record(connect, {
    user_id :: binary(),
    provider :: ema_attachments@connectors:provider(),
    reply :: gleam@erlang@process:subject({ok, binary()} |
        {error, ema_attachments@connectors:error()})
}).
