-record(attachment, {
    id :: binary(),
    kind :: ema_attachments@attachments:attachment_kind(),
    source :: ema_attachments@attachments:attachment_source(),
    display_name :: binary(),
    mime :: ema_attachments@attachments:option(binary()),
    size_bytes :: ema_attachments@attachments:option(integer()),
    source_ref :: ema_attachments@attachments:source_ref(),
    created_by :: binary(),
    created_at :: binary(),
    updated_at :: binary()
}).
