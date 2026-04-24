-module(ema_daemon@sqlite_ffi).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_daemon/sqlite_ffi.gleam").
-export([open/1, exec/2, prepare/2, bind_text/2, step/1, exec_stmt/1, finalize/1, close/1, last_insert_rowid/1, persist_org_created/5, topbar_projection_json/1, event_trail_projection_json/1]).
-export_type([db/0, stmt/0, error/0, step_result/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Thin Gleam FFI wrapper over the `esqlite` Erlang NIF.\n"
    "\n"
    " Exposes just the minimal surface the daemon needs: open, exec,\n"
    " prepare/bind/step/finalize, close, plus `last_insert_rowid`.\n"
    "\n"
    " Values are returned as opaque handles plus minimal data types.\n"
).

-type db() :: any().

-type stmt() :: any().

-type error() :: {sqlite_error, binary()}.

-type step_result() :: {step_row, gleam@dynamic:dynamic_()} | step_done.

-file("src/ema_daemon/sqlite_ffi.gleam", 25).
?DOC(" Open `path` and switch to WAL mode. Creates the file if missing.\n").
-spec open(binary()) -> {ok, db()} | {error, error()}.
open(Path) ->
    case ema_sqlite_helpers:open(Path) of
        {ok, Db} ->
            _ = ema_sqlite_helpers:exec(Db, <<"PRAGMA journal_mode=WAL;"/utf8>>),
            _ = ema_sqlite_helpers:exec(
                Db,
                <<"PRAGMA synchronous=NORMAL;"/utf8>>
            ),
            {ok, Db};

        {error, Reason} ->
            {error, {sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

-file("src/ema_daemon/sqlite_ffi.gleam", 38).
-spec exec(db(), binary()) -> {ok, nil} | {error, error()}.
exec(Db, Sql) ->
    case ema_sqlite_helpers:exec(Db, Sql) of
        {ok, _} ->
            {ok, nil};

        {error, Reason} ->
            {error, {sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

-file("src/ema_daemon/sqlite_ffi.gleam", 45).
-spec prepare(db(), binary()) -> {ok, stmt()} | {error, error()}.
prepare(Db, Sql) ->
    case ema_sqlite_helpers:prepare(Db, Sql) of
        {ok, Stmt} ->
            {ok, Stmt};

        {error, Reason} ->
            {error, {sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

-file("src/ema_daemon/sqlite_ffi.gleam", 54).
?DOC(
    " Bind a list of text values to `?1..?N`. The daemon only binds text\n"
    " for now; other types are added on demand.\n"
).
-spec bind_text(stmt(), list(binary())) -> {ok, nil} | {error, error()}.
bind_text(Stmt, Args) ->
    case ema_sqlite_helpers:bind(Stmt, Args) of
        {ok, _} ->
            {ok, nil};

        {error, Reason} ->
            {error, {sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

-file("src/ema_daemon/sqlite_ffi.gleam", 63).
?DOC(
    " Advance the statement by one row. Returns `Ok(Some(row))` for a row,\n"
    " `Ok(None)` when done, or `Error` on failure.\n"
).
-spec step(stmt()) -> {ok, step_result()} | {error, error()}.
step(Stmt) ->
    Result = esqlite3:step(Stmt),
    ema_sqlite_helpers:classify_step(Result).

-file("src/ema_daemon/sqlite_ffi.gleam", 74).
?DOC(" Convenience: run a prepared+bound DML statement to completion.\n").
-spec exec_stmt(stmt()) -> {ok, nil} | {error, error()}.
exec_stmt(Stmt) ->
    case step(Stmt) of
        {ok, step_done} ->
            {ok, nil};

        {ok, {step_row, _}} ->
            {ok, nil};

        {error, E} ->
            {error, E}
    end.

-file("src/ema_daemon/sqlite_ffi.gleam", 82).
-spec finalize(stmt()) -> nil.
finalize(_) ->
    nil.

-file("src/ema_daemon/sqlite_ffi.gleam", 88).
-spec close(db()) -> nil.
close(Db) ->
    _ = esqlite3:close(Db),
    nil.

-file("src/ema_daemon/sqlite_ffi.gleam", 93).
-spec last_insert_rowid(db()) -> integer().
last_insert_rowid(Db) ->
    esqlite3:last_insert_rowid(Db).

-file("src/ema_daemon/sqlite_ffi.gleam", 97).
-spec persist_org_created(db(), binary(), binary(), binary(), binary()) -> {ok,
        nil} |
    {error, error()}.
persist_org_created(Db, Org_id, Payload_json, Created_at, Actor) ->
    case ema_sqlite_helpers:persist_org_created(
        Db,
        Org_id,
        Payload_json,
        Created_at,
        Actor
    ) of
        {ok, _} ->
            {ok, nil};

        {error, Reason} ->
            {error, {sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

-file("src/ema_daemon/sqlite_ffi.gleam", 110).
-spec topbar_projection_json(db()) -> binary().
topbar_projection_json(Db) ->
    ema_sqlite_helpers:topbar_projection_json(Db).

-file("src/ema_daemon/sqlite_ffi.gleam", 114).
-spec event_trail_projection_json(db()) -> binary().
event_trail_projection_json(Db) ->
    ema_sqlite_helpers:event_trail_projection_json(Db).
