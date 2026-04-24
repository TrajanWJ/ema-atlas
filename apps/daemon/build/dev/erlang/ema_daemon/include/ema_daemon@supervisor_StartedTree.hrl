-record(started_tree, {
    bus :: gleam@erlang@process:subject(ema_daemon@bus:msg()),
    registry :: gleam@erlang@process:subject(ema_daemon@registry:msg())
}).
