-record(picker_item, {
    id :: binary(),
    provider :: ema_attachments@connectors:provider(),
    display_name :: binary(),
    kind_hint :: binary()
}).
