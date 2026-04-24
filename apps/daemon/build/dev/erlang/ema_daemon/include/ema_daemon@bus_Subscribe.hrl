-record(subscribe, {
    target :: gleam@erlang@process:subject(ema_daemon@bus:delivery()),
    from_txid :: gleam@option:option(integer()),
    reply :: gleam@erlang@process:subject(nil)
}).
