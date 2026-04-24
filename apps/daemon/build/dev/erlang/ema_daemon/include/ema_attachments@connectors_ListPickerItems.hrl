-record(list_picker_items, {
    connector_id :: binary(),
    reply :: gleam@erlang@process:subject({ok,
            list(ema_attachments@connectors:picker_item())} |
        {error, ema_attachments@connectors:error()})
}).
