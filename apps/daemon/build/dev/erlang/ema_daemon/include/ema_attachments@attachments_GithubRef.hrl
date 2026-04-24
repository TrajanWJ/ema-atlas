-record(github_ref, {
    owner :: binary(),
    repo :: binary(),
    ref :: ema_attachments@attachments:option(binary()),
    path :: ema_attachments@attachments:option(binary())
}).
