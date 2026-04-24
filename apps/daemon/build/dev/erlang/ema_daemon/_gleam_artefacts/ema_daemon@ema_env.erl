-module(ema_daemon@ema_env).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_daemon/ema_env.gleam").
-export([getenv/1, getenv_or/2]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Tiny wrapper over Erlang's `os:getenv` that returns a\n"
    " `Result(String, Nil)` for nicer pattern-matching from Gleam.\n"
).

-file("src/ema_daemon/ema_env.gleam", 12).
-spec getenv(binary()) -> {ok, binary()} | {error, nil}.
getenv(Name) ->
    ema_env_ffi:getenv(Name).

-file("src/ema_daemon/ema_env.gleam", 4).
-spec getenv_or(binary(), binary()) -> binary().
getenv_or(Name, Default) ->
    case ema_env_ffi:getenv(Name) of
        {ok, Value} ->
            Value;

        {error, _} ->
            Default
    end.
