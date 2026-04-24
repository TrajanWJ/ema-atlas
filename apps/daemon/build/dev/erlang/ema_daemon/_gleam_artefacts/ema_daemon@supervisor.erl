-module(ema_daemon@supervisor).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_daemon/supervisor.gleam").
-export([start/0, children/0]).
-export_type([started_tree/0, supervisor_error/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Top-level supervision tree for the EMA daemon.\n"
    "\n"
    " M1 shape:\n"
    "\n"
    "   ema_daemon_sup (one_for_one)\n"
    "   ├── bus              (singleton, opens canonical.db)\n"
    "   ├── registry         (named-actor registry)\n"
    "   └── shell_ipc        (mist WS acceptor bound to the bus)\n"
    "\n"
    " Context writers (identity/orgs/spaces/...) come online in M2+. For\n"
    " M1 we start the three children directly and link them to the\n"
    " entrypoint process; the top-level process is the supervisor of\n"
    " record. A real `gleam/otp/static_supervisor` wrapper lands in M2\n"
    " once there are more children to manage.\n"
).

-type started_tree() :: {started_tree,
        gleam@erlang@process:subject(ema_daemon@bus:msg()),
        gleam@erlang@process:subject(ema_daemon@registry:msg())}.

-type supervisor_error() :: {child_failed_to_start, binary(), binary()}.

-file("src/ema_daemon/supervisor.gleam", 57).
-spec describe_start_error(gleam@otp@actor:start_error()) -> binary().
describe_start_error(E) ->
    case E of
        init_timeout ->
            <<"init timeout"/utf8>>;

        {init_failed, M} ->
            <<"init failed: "/utf8, M/binary>>;

        {init_exited, _} ->
            <<"init exited"/utf8>>
    end.

-file("src/ema_daemon/supervisor.gleam", 32).
?DOC(" Start bus + registry + IPC, wire them together.\n").
-spec start() -> {ok, started_tree()} | {error, supervisor_error()}.
start() ->
    Db_path = ema_daemon@ema_env:getenv_or(
        <<"EMA_CANONICAL_DB"/utf8>>,
        <<"./canonical.db"/utf8>>
    ),
    Bind_addr = ema_daemon@ema_env:getenv_or(
        <<"EMA_IPC_BIND"/utf8>>,
        <<"127.0.0.1"/utf8>>
    ),
    Port = 49555,
    case ema_daemon@bus:start(Db_path) of
        {error, E} ->
            {error,
                {child_failed_to_start, <<"bus"/utf8>>, describe_start_error(E)}};

        {ok, Bus_started} ->
            Bus_subject = erlang:element(3, Bus_started),
            case ema_daemon@registry:start() of
                {error, E@1} ->
                    {error,
                        {child_failed_to_start,
                            <<"registry"/utf8>>,
                            describe_start_error(E@1)}};

                {ok, Registry_started} ->
                    Registry_subject = erlang:element(3, Registry_started),
                    case ema_shell_ipc@ema_shell_ipc:start(
                        Bus_subject,
                        Bind_addr,
                        Port
                    ) of
                        {error, Reason} ->
                            {error,
                                {child_failed_to_start,
                                    <<"shell_ipc"/utf8>>,
                                    Reason}};

                        {ok, _} ->
                            {ok, {started_tree, Bus_subject, Registry_subject}}
                    end
            end
    end.

-file("src/ema_daemon/supervisor.gleam", 65).
-spec children() -> list(binary()).
children() ->
    [<<"bus"/utf8>>, <<"registry"/utf8>>, <<"shell_ipc"/utf8>>].
