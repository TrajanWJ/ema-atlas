{application, ema_daemon, [
    {vsn, "0.0.5"},
    {applications, [esqlite,
                    gleam_erlang,
                    gleam_http,
                    gleam_json,
                    gleam_otp,
                    gleam_stdlib,
                    gleeunit,
                    mist]},
    {description, "EMA daemon — canonical truth + sync + IPC for 0.0.5."},
    {modules, []},
    {registered, []}
]}.
