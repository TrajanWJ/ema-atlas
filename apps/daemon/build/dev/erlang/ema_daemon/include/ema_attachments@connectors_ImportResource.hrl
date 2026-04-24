-record(import_resource, {
    connector_id :: binary(),
    picker_item_id :: binary(),
    by :: binary(),
    reply :: gleam@erlang@process:subject({ok, binary()} |
        {error, ema_attachments@connectors:error()})
}).
