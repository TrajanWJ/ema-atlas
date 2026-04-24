-record(link, {
    attachment_id :: binary(),
    object_kind :: binary(),
    object_id :: binary(),
    by :: binary(),
    reply :: gleam@erlang@process:subject({ok, nil} |
        {error, ema_attachments@attachments:error()})
}).
