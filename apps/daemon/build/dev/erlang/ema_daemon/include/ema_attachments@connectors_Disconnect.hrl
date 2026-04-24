-record(disconnect, {
    connector_id :: binary(),
    by :: binary(),
    reply :: gleam@erlang@process:subject({ok, nil} |
        {error, ema_attachments@connectors:error()})
}).
