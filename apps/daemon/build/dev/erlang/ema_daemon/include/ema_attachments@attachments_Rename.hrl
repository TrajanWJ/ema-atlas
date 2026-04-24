-record(rename, {
    attachment_id :: binary(),
    name :: binary(),
    reply :: gleam@erlang@process:subject({ok, nil} |
        {error, ema_attachments@attachments:error()})
}).
