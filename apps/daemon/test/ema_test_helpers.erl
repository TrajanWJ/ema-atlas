-module(ema_test_helpers).
-export([tmp_path/1, delete_file/1, event_kind_org_rows/1]).

tmp_path(Suffix) when is_binary(Suffix) ->
    Base = integer_to_binary(erlang:system_time(microsecond)),
    <<"/tmp/", Base/binary, "-", Suffix/binary>>.

delete_file(Path) when is_binary(Path) ->
    case file:delete(Path) of
        ok -> {ok, nil};
        {error, _} -> {ok, nil}
    end.

event_kind_org_rows(Path) when is_binary(Path) ->
    case esqlite3:open(binary_to_list(Path)) of
        {ok, Db} ->
            Rows = select_event_kind_org_rows(Db),
            _ = esqlite3:close(Db),
            Rows;
        {error, _Reason} ->
            []
    end.

select_event_kind_org_rows(Db) ->
    Sql = <<"SELECT kind, org_id FROM events ORDER BY txid">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_event_kind_org_rows(Stmt, []);
        {error, _Reason} -> []
    end.

collect_event_kind_org_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Kind, OrgId] ->
            collect_event_kind_org_rows(Stmt, [{to_binary(Kind), to_binary(OrgId)} | Acc]);
        {row, {Kind, OrgId}} ->
            collect_event_kind_org_rows(Stmt, [{to_binary(Kind), to_binary(OrgId)} | Acc]);
        {row, [Kind, OrgId]} ->
            collect_event_kind_org_rows(Stmt, [{to_binary(Kind), to_binary(OrgId)} | Acc]);
        '$done' ->
            lists:reverse(Acc);
        _ ->
            lists:reverse(Acc)
    end.

to_binary(V) when is_binary(V) -> V;
to_binary(V) when is_list(V) -> iolist_to_binary(V).
