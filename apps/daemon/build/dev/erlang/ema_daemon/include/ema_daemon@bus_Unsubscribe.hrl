-record(unsubscribe, {
    target :: gleam@erlang@process:subject(ema_daemon@bus:delivery()),
    reply :: gleam@erlang@process:subject(nil)
}).
