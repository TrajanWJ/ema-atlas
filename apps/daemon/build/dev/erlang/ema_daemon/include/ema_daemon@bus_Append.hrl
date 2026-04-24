-record(append, {
    env :: ema_daemon@event_envelope:envelope(),
    reply :: gleam@erlang@process:subject({ok, integer()} |
        {error, ema_daemon@bus:append_error()})
}).
