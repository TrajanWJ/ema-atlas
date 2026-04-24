-record(register, {
    key :: binary(),
    target :: gleam@erlang@process:subject(gleam@dynamic:dynamic_()),
    pid :: gleam@erlang@process:pid_(),
    reply :: gleam@erlang@process:subject({ok, nil} |
        {error, ema_daemon@registry:registry_error()})
}).
