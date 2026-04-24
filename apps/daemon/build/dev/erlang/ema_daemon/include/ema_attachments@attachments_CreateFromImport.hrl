-record(create_from_import, {
    attachment :: ema_attachments@attachments:attachment(),
    reply :: gleam@erlang@process:subject({ok, binary()} |
        {error, ema_attachments@attachments:error()})
}).
