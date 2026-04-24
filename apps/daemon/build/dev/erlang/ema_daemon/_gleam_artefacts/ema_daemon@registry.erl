-module(ema_daemon@registry).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_daemon/registry.gleam").
-export([start/0, supervised/0, register/4, unregister/2, lookup/2, list_keys/1, unused_keepalive/0]).
-export_type([msg/0, registry_error/0, entry/0, state/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Named-actor registry.\n"
    "\n"
    " Maps `<kind>:<ulid>` strings to a `Subject(Dynamic)`. When a\n"
    " registered process dies the registry observes the DOWN and drops\n"
    " the binding so stale lookups don't succeed.\n"
    "\n"
    " M1 scope: runtime-only — no persistence. Entries are lost on\n"
    " daemon restart and re-established lazily by each context.\n"
).

-type msg() :: {register,
        binary(),
        gleam@erlang@process:subject(gleam@dynamic:dynamic_()),
        gleam@erlang@process:pid_(),
        gleam@erlang@process:subject({ok, nil} | {error, registry_error()})} |
    {unregister, binary(), gleam@erlang@process:subject(nil)} |
    {lookup,
        binary(),
        gleam@erlang@process:subject({ok,
                gleam@erlang@process:subject(gleam@dynamic:dynamic_())} |
            {error, registry_error()})} |
    {list, gleam@erlang@process:subject(list(binary()))} |
    {down, gleam@erlang@process:pid_()}.

-type registry_error() :: {already_registered, binary()} | {not_found, binary()}.

-type entry() :: {entry,
        gleam@erlang@process:subject(gleam@dynamic:dynamic_()),
        gleam@erlang@process:pid_()}.

-type state() :: {state, gleam@dict:dict(binary(), entry())}.

-file("src/ema_daemon/registry.gleam", 56).
-spec handle(state(), msg()) -> gleam@otp@actor:next(state(), msg()).
handle(State, Msg) ->
    case Msg of
        {register, Key, Target, Pid, Reply} ->
            case gleam_stdlib:map_get(erlang:element(2, State), Key) of
                {ok, _} ->
                    gleam@erlang@process:send(
                        Reply,
                        {error, {already_registered, Key}}
                    ),
                    gleam@otp@actor:continue(State);

                {error, _} ->
                    _ = gleam@erlang@process:monitor(Pid),
                    gleam@erlang@process:send(Reply, {ok, nil}),
                    Bindings = gleam@dict:insert(
                        erlang:element(2, State),
                        Key,
                        {entry, Target, Pid}
                    ),
                    gleam@otp@actor:continue({state, Bindings})
            end;

        {unregister, Key@1, Reply@1} ->
            Bindings@1 = gleam@dict:delete(erlang:element(2, State), Key@1),
            gleam@erlang@process:send(Reply@1, nil),
            gleam@otp@actor:continue({state, Bindings@1});

        {lookup, Key@2, Reply@2} ->
            case gleam_stdlib:map_get(erlang:element(2, State), Key@2) of
                {ok, Entry} ->
                    gleam@erlang@process:send(
                        Reply@2,
                        {ok, erlang:element(2, Entry)}
                    );

                {error, _} ->
                    gleam@erlang@process:send(
                        Reply@2,
                        {error, {not_found, Key@2}}
                    )
            end,
            gleam@otp@actor:continue(State);

        {list, Reply@3} ->
            gleam@erlang@process:send(
                Reply@3,
                maps:keys(erlang:element(2, State))
            ),
            gleam@otp@actor:continue(State);

        {down, Dead_pid} ->
            Bindings@2 = gleam@dict:filter(
                erlang:element(2, State),
                fun(_, Entry@1) -> erlang:element(3, Entry@1) /= Dead_pid end
            ),
            gleam@otp@actor:continue({state, Bindings@2})
    end.

-file("src/ema_daemon/registry.gleam", 46).
-spec start() -> {ok,
        gleam@otp@actor:started(gleam@erlang@process:subject(msg()))} |
    {error, gleam@otp@actor:start_error()}.
start() ->
    _pipe = gleam@otp@actor:new({state, maps:new()}),
    _pipe@1 = gleam@otp@actor:on_message(_pipe, fun handle/2),
    gleam@otp@actor:start(_pipe@1).

-file("src/ema_daemon/registry.gleam", 52).
-spec supervised() -> gleam@otp@supervision:child_specification(gleam@erlang@process:subject(msg())).
supervised() ->
    gleam@otp@supervision:worker(fun start/0).

-file("src/ema_daemon/registry.gleam", 105).
-spec register(
    gleam@erlang@process:subject(msg()),
    binary(),
    gleam@erlang@process:subject(gleam@dynamic:dynamic_()),
    gleam@erlang@process:pid_()
) -> {ok, nil} | {error, registry_error()}.
register(Reg, Key, Target, Pid) ->
    gleam@erlang@process:call(
        Reg,
        5000,
        fun(Reply) -> {register, Key, Target, Pid, Reply} end
    ).

-file("src/ema_daemon/registry.gleam", 114).
-spec unregister(gleam@erlang@process:subject(msg()), binary()) -> nil.
unregister(Reg, Key) ->
    gleam@erlang@process:call(
        Reg,
        5000,
        fun(Reply) -> {unregister, Key, Reply} end
    ).

-file("src/ema_daemon/registry.gleam", 118).
-spec lookup(gleam@erlang@process:subject(msg()), binary()) -> {ok,
        gleam@erlang@process:subject(gleam@dynamic:dynamic_())} |
    {error, registry_error()}.
lookup(Reg, Key) ->
    gleam@erlang@process:call(Reg, 5000, fun(Reply) -> {lookup, Key, Reply} end).

-file("src/ema_daemon/registry.gleam", 125).
-spec list_keys(gleam@erlang@process:subject(msg())) -> list(binary()).
list_keys(Reg) ->
    gleam@erlang@process:call(Reg, 5000, fun(Reply) -> {list, Reply} end).

-file("src/ema_daemon/registry.gleam", 130).
-spec unused_helper(list(entry())) -> list(entry()).
unused_helper(X) ->
    lists:reverse(X).

-file("src/ema_daemon/registry.gleam", 134).
-spec unused_keepalive() -> nil.
unused_keepalive() ->
    _ = unused_helper([]),
    nil.
