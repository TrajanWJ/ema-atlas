-module(ema_daemon@bus).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_daemon/bus.gleam").
-export([start/1, supervised/1, append/2, subscribe/3, unsubscribe/2, topbar_projection_json/1, event_trail_projection_json/1]).
-export_type([msg/0, delivery/0, append_error/0, subscriber/0, state/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " In-process event bus.\n"
    "\n"
    " Writer actors append events through the bus so that:\n"
    "   (1) append order is linear per daemon instance,\n"
    "   (2) projections and the IPC fan-out subscribe in one place,\n"
    "   (3) replication reads from the bus tail.\n"
    "\n"
    " See `packages/contracts/events/` for the canonical event shape.\n"
    "\n"
    " Wave 1 (M1): real gleam_otp actor backed by the canonical SQLite\n"
    " database opened in WAL mode. Every append is committed before the\n"
    " txid is returned.\n"
).

-type msg() :: {append,
        ema_daemon@event_envelope:envelope(),
        gleam@erlang@process:subject({ok, integer()} | {error, append_error()})} |
    {subscribe,
        gleam@erlang@process:subject(delivery()),
        gleam@option:option(integer()),
        gleam@erlang@process:subject(nil)} |
    {unsubscribe,
        gleam@erlang@process:subject(delivery()),
        gleam@erlang@process:subject(nil)} |
    {topbar_projection, gleam@erlang@process:subject(binary())} |
    {event_trail_projection, gleam@erlang@process:subject(binary())}.

-type delivery() :: {event, integer(), ema_daemon@event_envelope:envelope()} |
    {subscription_dropped, binary()}.

-type append_error() :: {invalid_kind, binary()} |
    {not_in_catalog, binary()} |
    {persistence_failed, binary()}.

-type subscriber() :: {subscriber, gleam@erlang@process:subject(delivery())}.

-type state() :: {state, ema_daemon@sqlite_ffi:db(), list(subscriber())}.

-file("src/ema_daemon/bus.gleam", 183).
-spec subjects_equal(
    gleam@erlang@process:subject(AVL),
    gleam@erlang@process:subject(AVL)
) -> boolean().
subjects_equal(A, B) ->
    A =:= B.

-file("src/ema_daemon/bus.gleam", 308).
-spec replay_from(
    ema_daemon@sqlite_ffi:db(),
    integer(),
    gleam@erlang@process:subject(delivery())
) -> nil.
replay_from(_, _, _) ->
    nil.

-file("src/ema_daemon/bus.gleam", 300).
-spec mailbox_size(gleam@erlang@process:subject(delivery())) -> integer().
mailbox_size(_) ->
    0.

-file("src/ema_daemon/bus.gleam", 281).
-spec fan_out(
    list(subscriber()),
    integer(),
    ema_daemon@event_envelope:envelope()
) -> list(subscriber()).
fan_out(Subs, Txid, Env) ->
    gleam@list:filter(
        Subs,
        fun(Sub) -> case mailbox_size(erlang:element(2, Sub)) of
                Size when Size > 500 ->
                    gleam@erlang@process:send(
                        erlang:element(2, Sub),
                        {subscription_dropped, <<"backpressure"/utf8>>}
                    ),
                    false;

                _ ->
                    gleam@erlang@process:send(
                        erlang:element(2, Sub),
                        {event, Txid, Env}
                    ),
                    true
            end end
    ).

-file("src/ema_daemon/bus.gleam", 252).
-spec persist_compact_object(
    ema_daemon@sqlite_ffi:db(),
    ema_daemon@event_envelope:envelope()
) -> {ok, nil} | {error, append_error()}.
persist_compact_object(Db, Env) ->
    case erlang:element(3, Env) of
        <<"org.created"/utf8>> ->
            case ema_daemon@sqlite_ffi:persist_org_created(
                Db,
                erlang:element(6, Env),
                erlang:element(11, Env),
                erlang:element(4, Env),
                erlang:element(5, Env)
            ) of
                {ok, nil} ->
                    {ok, nil};

                {error, {sqlite_error, M}} ->
                    {error, {persistence_failed, M}}
            end;

        _ ->
            {ok, nil}
    end.

-file("src/ema_daemon/bus.gleam", 274).
-spec opt_str(ema_daemon@event_envelope:option(binary())) -> binary().
opt_str(Value) ->
    case Value of
        {some, V} ->
            V;

        none ->
            <<""/utf8>>
    end.

-file("src/ema_daemon/bus.gleam", 210).
-spec persist(ema_daemon@sqlite_ffi:db(), ema_daemon@event_envelope:envelope()) -> {ok,
        integer()} |
    {error, append_error()}.
persist(Db, Env) ->
    Sql = <<"INSERT INTO events
      (event_id, kind, ts, actor, org_id, space_id, project_id,
       dispatch_id, execution_id, payload_json)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10);"/utf8>>,
    case ema_daemon@sqlite_ffi:prepare(Db, Sql) of
        {error, {sqlite_error, M}} ->
            {error, {persistence_failed, M}};

        {ok, Stmt} ->
            Args = [erlang:element(2, Env),
                erlang:element(3, Env),
                erlang:element(4, Env),
                erlang:element(5, Env),
                erlang:element(6, Env),
                opt_str(erlang:element(7, Env)),
                opt_str(erlang:element(8, Env)),
                opt_str(erlang:element(9, Env)),
                opt_str(erlang:element(10, Env)),
                erlang:element(11, Env)],
            case ema_daemon@sqlite_ffi:bind_text(Stmt, Args) of
                {error, {sqlite_error, M@1}} ->
                    {error, {persistence_failed, M@1}};

                {ok, nil} ->
                    case ema_daemon@sqlite_ffi:exec_stmt(Stmt) of
                        {error, {sqlite_error, M@2}} ->
                            {error, {persistence_failed, M@2}};

                        {ok, nil} ->
                            Txid = ema_daemon@sqlite_ffi:last_insert_rowid(Db),
                            _ = ema_daemon@sqlite_ffi:finalize(Stmt),
                            case persist_compact_object(Db, Env) of
                                {ok, nil} ->
                                    {ok, Txid};

                                {error, E} ->
                                    {error, E}
                            end
                    end
            end
    end.

-file("src/ema_daemon/bus.gleam", 194).
-spec validate(ema_daemon@event_envelope:envelope()) -> {ok, nil} |
    {error, append_error()}.
validate(Env) ->
    case ema_daemon@event_envelope:validate(Env) of
        {ok, nil} ->
            {ok, nil};

        {error, empty_kind} ->
            {error, {invalid_kind, <<""/utf8>>}};

        {error, {not_in_catalog, K}} ->
            {error, {not_in_catalog, K}};

        {error, empty_event_id} ->
            {error, {persistence_failed, <<"empty event_id"/utf8>>}};

        {error, empty_timestamp} ->
            {error, {persistence_failed, <<"empty timestamp"/utf8>>}};

        {error, empty_actor} ->
            {error, {persistence_failed, <<"empty actor"/utf8>>}};

        {error, empty_org} ->
            {error, {persistence_failed, <<"empty org_id"/utf8>>}};

        {error, empty_payload} ->
            {error, {persistence_failed, <<"empty payload_json"/utf8>>}}
    end.

-file("src/ema_daemon/bus.gleam", 187).
-spec do_append(
    ema_daemon@sqlite_ffi:db(),
    ema_daemon@event_envelope:envelope()
) -> {ok, integer()} | {error, append_error()}.
do_append(Db, Env) ->
    case validate(Env) of
        {error, E} ->
            {error, E};

        {ok, nil} ->
            persist(Db, Env)
    end.

-file("src/ema_daemon/bus.gleam", 134).
-spec handle(state(), msg()) -> gleam@otp@actor:next(state(), msg()).
handle(State, Msg) ->
    case Msg of
        {append, Env, Reply} ->
            case do_append(erlang:element(2, State), Env) of
                {ok, Txid} ->
                    gleam@erlang@process:send(Reply, {ok, Txid}),
                    Live = fan_out(erlang:element(3, State), Txid, Env),
                    gleam@otp@actor:continue(
                        {state, erlang:element(2, State), Live}
                    );

                {error, E} ->
                    gleam@erlang@process:send(Reply, {error, E}),
                    gleam@otp@actor:continue(State)
            end;

        {subscribe, Target, From_txid, Reply@1} ->
            _ = case From_txid of
                {some, Since} ->
                    replay_from(erlang:element(2, State), Since, Target);

                none ->
                    nil
            end,
            gleam@erlang@process:send(Reply@1, nil),
            Subs = [{subscriber, Target} | erlang:element(3, State)],
            gleam@otp@actor:continue({state, erlang:element(2, State), Subs});

        {unsubscribe, Target@1, Reply@2} ->
            gleam@erlang@process:send(Reply@2, nil),
            Subs@1 = gleam@list:filter(
                erlang:element(3, State),
                fun(S) -> not subjects_equal(erlang:element(2, S), Target@1) end
            ),
            gleam@otp@actor:continue({state, erlang:element(2, State), Subs@1});

        {topbar_projection, Reply@3} ->
            gleam@erlang@process:send(
                Reply@3,
                ema_daemon@sqlite_ffi:topbar_projection_json(
                    erlang:element(2, State)
                )
            ),
            gleam@otp@actor:continue(State);

        {event_trail_projection, Reply@4} ->
            gleam@erlang@process:send(
                Reply@4,
                ema_daemon@sqlite_ffi:event_trail_projection_json(
                    erlang:element(2, State)
                )
            ),
            gleam@otp@actor:continue(State)
    end.

-file("src/ema_daemon/bus.gleam", 98).
-spec init_db(binary()) -> {ok, ema_daemon@sqlite_ffi:db()} |
    {error, ema_daemon@sqlite_ffi:error()}.
init_db(Path) ->
    case ema_daemon@sqlite_ffi:open(Path) of
        {ok, Db} ->
            Ddl = <<"CREATE TABLE IF NOT EXISTS events (
          txid INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          ts TEXT NOT NULL,
          actor TEXT NOT NULL,
          org_id TEXT NOT NULL,
          space_id TEXT,
          project_id TEXT,
          dispatch_id TEXT,
          execution_id TEXT,
          payload_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS orgs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL
        );"/utf8>>,
            case ema_daemon@sqlite_ffi:exec(Db, Ddl) of
                {ok, nil} ->
                    {ok, Db};

                {error, E} ->
                    {error, E}
            end;

        {error, E@1} ->
            {error, E@1}
    end.

-file("src/ema_daemon/bus.gleam", 76).
-spec start(binary()) -> {ok,
        gleam@otp@actor:started(gleam@erlang@process:subject(msg()))} |
    {error, gleam@otp@actor:start_error()}.
start(Db_path) ->
    _pipe@3 = gleam@otp@actor:new_with_initialiser(
        5000,
        fun(Self) -> case init_db(Db_path) of
                {ok, Db} ->
                    _pipe = {state, Db, []},
                    _pipe@1 = gleam@otp@actor:initialised(_pipe),
                    _pipe@2 = gleam@otp@actor:returning(_pipe@1, Self),
                    {ok, _pipe@2};

                {error, {sqlite_error, Msg}} ->
                    {error,
                        <<"bus: failed to open canonical db: "/utf8,
                            Msg/binary>>}
            end end
    ),
    _pipe@4 = gleam@otp@actor:on_message(_pipe@3, fun handle/2),
    gleam@otp@actor:start(_pipe@4).

-file("src/ema_daemon/bus.gleam", 94).
-spec supervised(binary()) -> gleam@otp@supervision:child_specification(gleam@erlang@process:subject(msg())).
supervised(Db_path) ->
    gleam@otp@supervision:worker(fun() -> start(Db_path) end).

-file("src/ema_daemon/bus.gleam", 323).
-spec append(
    gleam@erlang@process:subject(msg()),
    ema_daemon@event_envelope:envelope()
) -> {ok, integer()} | {error, append_error()}.
append(Bus, Env) ->
    gleam@erlang@process:call(Bus, 5000, fun(Reply) -> {append, Env, Reply} end).

-file("src/ema_daemon/bus.gleam", 327).
-spec subscribe(
    gleam@erlang@process:subject(msg()),
    gleam@erlang@process:subject(delivery()),
    gleam@option:option(integer())
) -> nil.
subscribe(Bus, Target, From_txid) ->
    gleam@erlang@process:call(
        Bus,
        5000,
        fun(Reply) -> {subscribe, Target, From_txid, Reply} end
    ).

-file("src/ema_daemon/bus.gleam", 335).
-spec unsubscribe(
    gleam@erlang@process:subject(msg()),
    gleam@erlang@process:subject(delivery())
) -> nil.
unsubscribe(Bus, Target) ->
    gleam@erlang@process:call(
        Bus,
        5000,
        fun(Reply) -> {unsubscribe, Target, Reply} end
    ).

-file("src/ema_daemon/bus.gleam", 339).
-spec topbar_projection_json(gleam@erlang@process:subject(msg())) -> binary().
topbar_projection_json(Bus) ->
    gleam@erlang@process:call(
        Bus,
        5000,
        fun(Reply) -> {topbar_projection, Reply} end
    ).

-file("src/ema_daemon/bus.gleam", 343).
-spec event_trail_projection_json(gleam@erlang@process:subject(msg())) -> binary().
event_trail_projection_json(Bus) ->
    gleam@erlang@process:call(
        Bus,
        5000,
        fun(Reply) -> {event_trail_projection, Reply} end
    ).
