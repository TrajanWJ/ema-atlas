-record(delete, {
    attachment_id :: binary(),
    by :: binary(),
    reply :: gleam@erlang@process:subject({ok, nil} |
        {error, ema_attachments@attachments:error()})
}).
