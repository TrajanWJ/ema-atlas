-record(lookup, {
    key :: binary(),
    reply :: gleam@erlang@process:subject({ok,
            gleam@erlang@process:subject(gleam@dynamic:dynamic_())} |
        {error, ema_daemon@registry:registry_error()})
}).
