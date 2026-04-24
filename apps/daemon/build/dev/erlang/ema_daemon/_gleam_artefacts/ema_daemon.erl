-module(ema_daemon).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_daemon.gleam").
-export([main/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " EMA daemon entrypoint.\n"
    "\n"
    " Boots the top-level supervisor and blocks forever. All actual work\n"
    " happens inside the tree — see `ema_daemon/supervisor.gleam`.\n"
).

-file("src/ema_daemon.gleam", 11).
-spec main() -> nil.
main() ->
    gleam_stdlib:println(<<"ema_daemon: starting 0.0.5"/utf8>>),
    case ema_daemon@supervisor:start() of
        {ok, _} ->
            gleam_stdlib:println(<<"daemon up"/utf8>>),
            gleam_erlang_ffi:sleep_forever();

        {error, Err} ->
            gleam_stdlib:println(
                <<"ema_daemon: supervisor failed to start"/utf8>>
            ),
            gleam_stdlib:println(gleam@string:inspect(Err)),
            nil
    end.
