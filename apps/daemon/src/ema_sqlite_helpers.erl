%% Small helper module for the Gleam `sqlite_ffi` wrapper.
%%
%% esqlite3:step/1 returns `{row, Tuple}`, `'$done'`, or `{error, Reason}`;
%% we normalise those into Gleam-friendly tagged shapes.
%%
%% esqlite3:open/1 requires a charlist; Gleam strings arrive as binaries,
%% so we translate here rather than sprinkle conversions through the
%% Gleam module.

-module(ema_sqlite_helpers).
-export([
    classify_step/1,
    inspect_reason/1,
    open/1,
    exec/2,
    prepare/2,
    bind/2,
    persist_org_created/5,
    persist_space_created/6,
    persist_project_created/7,
    topbar_projection_json/1,
    event_trail_projection_json/1,
    event_exists/3
]).

open(Path) ->
    esqlite3:open(to_charlist(Path)).

exec(Db, Sql) ->
    case esqlite3:exec(Db, to_binary(Sql)) of
        ok -> {ok, nil};
        {error, _}=E -> E;
        Other -> {ok, Other}
    end.

prepare(Db, Sql) ->
    esqlite3:prepare(Db, to_binary(Sql)).

bind(Stmt, Args) ->
    case esqlite3:bind(Stmt, Args) of
        ok -> {ok, nil};
        {error, _}=E -> E;
        Other -> {ok, Other}
    end.

persist_org_created(Db, OrgId, PayloadJson, CreatedAt, Actor) ->
    Name = extract_json_string(PayloadJson, <<"name">>),
    Sql = <<"INSERT OR REPLACE INTO orgs (id, name, created_at, created_by)
             VALUES (?1, ?2, ?3, ?4)">>,
    exec_bound(Db, Sql, [OrgId, Name, CreatedAt, Actor]).

persist_space_created(Db, OrgId, SpaceId, PayloadJson, CreatedAt, Actor) ->
    Name = extract_json_string(PayloadJson, <<"name">>),
    IsDefault =
        case binary:match(to_binary(PayloadJson), <<"\"default\":true">>) of
            nomatch -> <<"false">>;
            _ -> <<"true">>
        end,
    Sql = <<"INSERT OR REPLACE INTO spaces
             (id, org_id, name, is_default, created_at, created_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)">>,
    exec_bound(Db, Sql, [SpaceId, OrgId, Name, IsDefault, CreatedAt, Actor]).

persist_project_created(Db, OrgId, SpaceId, ProjectId, PayloadJson, CreatedAt, Actor) ->
    Name = extract_json_string(PayloadJson, <<"name">>),
    Sql = <<"INSERT OR REPLACE INTO projects
             (id, space_id, org_id, name, created_at, created_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)">>,
    exec_bound(Db, Sql, [ProjectId, SpaceId, OrgId, Name, CreatedAt, Actor]).

exec_bound(Db, Sql, Args) ->
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            Result = esqlite3:bind(Stmt, Args),
            case Result of
                ok ->
                    case esqlite3:step(Stmt) of
                        '$done' -> {ok, nil};
                        {row, _} -> {ok, nil};
                        {error, Reason} -> {error, {sqlite_error, inspect_reason(Reason)}};
                        Other -> {error, {sqlite_error, inspect_reason(Other)}}
                    end;
                {error, Reason} -> {error, {sqlite_error, inspect_reason(Reason)}};
                Other -> {error, {sqlite_error, inspect_reason(Other)}}
            end;
        {error, Reason} ->
            {error, {sqlite_error, inspect_reason(Reason)}}
    end.

topbar_projection_json(Db) ->
    Orgs = select_orgs(Db),
    CurrentOrgId = current_org_id(Orgs),
    Spaces = select_spaces(Db, CurrentOrgId),
    CurrentSpaceId = current_space_id(Spaces),
    Projects = select_projects(Db, CurrentOrgId, CurrentSpaceId),
    Current = current_org_json(Orgs),
    CurrentSpace = current_space_json(Spaces),
    CurrentProject = current_project_json(Projects),
    OrgArray = join_json([org_json(Id, Name) || {Id, Name} <- Orgs]),
    SpaceArray = join_json([space_json(Id, OrgId, Name, IsDefault) || {Id, OrgId, Name, IsDefault} <- Spaces]),
    ProjectArray = join_json([project_json(Id, SpaceId, Name) || {Id, SpaceId, Name} <- Projects]),
    iolist_to_binary([
        <<"{\"user\":{\"id\":\"user:dev-local\",\"display_name\":\"Dev Operator\"},">>,
        <<"\"orgs\":[">>, OrgArray, <<"],">>,
        <<"\"current_org\":">>, Current, <<",">>,
        <<"\"spaces\":[">>, SpaceArray, <<"],">>,
        <<"\"current_space\":">>, CurrentSpace, <<",">>,
        <<"\"projects\":[">>, ProjectArray, <<"],">>,
        <<"\"current_project\":">>, CurrentProject, <<",">>,
        <<"\"node_state\":\"home\"}">>
    ]).

event_trail_projection_json(Db) ->
    Events = select_recent_events(Db),
    Items = join_json([event_summary_json(Txid, Kind, Ts, Payload) || {Txid, Kind, Ts, Payload} <- Events]),
    iolist_to_binary([<<"{\"events\":[">>, Items, <<"]}">>]).

event_exists(Db, Kind, OrgId) ->
    Sql = <<"SELECT 1 FROM events WHERE kind = ?1 AND org_id = ?2 LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [Kind, OrgId]) of
                ok ->
                    case esqlite3:step(Stmt) of
                        '$done' -> false;
                        {row, _} -> true;
                        [_] -> true;
                        _ -> false
                    end;
                _ -> false
            end;
        _ -> false
    end.

to_binary(V) when is_binary(V) -> V;
to_binary(V) when is_list(V) -> iolist_to_binary(V).

to_charlist(V) when is_binary(V) -> binary_to_list(V);
to_charlist(V) when is_list(V) -> V.

select_orgs(Db) ->
    Sql = <<"SELECT id, name FROM orgs ORDER BY created_at DESC, id DESC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_org_rows(Stmt, []);
        {error, _} -> []
    end.

collect_org_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, Name] -> collect_org_rows(Stmt, [{to_binary(Id), to_binary(Name)} | Acc]);
        {row, {Id, Name}} -> collect_org_rows(Stmt, [{to_binary(Id), to_binary(Name)} | Acc]);
        {row, [Id, Name]} -> collect_org_rows(Stmt, [{to_binary(Id), to_binary(Name)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

current_org_id([]) ->
    <<>>;
current_org_id([{Id, _Name} | _]) ->
    Id.

select_spaces(_Db, <<>>) ->
    [];
select_spaces(Db, OrgId) ->
    Sql = <<"SELECT id, org_id, name, is_default FROM spaces
             WHERE org_id = ?1
             ORDER BY is_default DESC, created_at ASC, id ASC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [OrgId]) of
                ok -> collect_space_rows(Stmt, []);
                _ -> []
            end;
        {error, _} -> []
    end.

collect_space_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, OrgId, Name, IsDefault] ->
            collect_space_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(Name), to_binary(IsDefault)} | Acc]);
        {row, {Id, OrgId, Name, IsDefault}} ->
            collect_space_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(Name), to_binary(IsDefault)} | Acc]);
        {row, [Id, OrgId, Name, IsDefault]} ->
            collect_space_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(Name), to_binary(IsDefault)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

current_space_id([]) ->
    <<>>;
current_space_id([{Id, _OrgId, _Name, _IsDefault} | _]) ->
    Id.

select_projects(_Db, <<>>, _SpaceId) ->
    [];
select_projects(_Db, _OrgId, <<>>) ->
    [];
select_projects(Db, OrgId, SpaceId) ->
    Sql = <<"SELECT id, space_id, name FROM projects
             WHERE org_id = ?1 AND space_id = ?2
             ORDER BY created_at DESC, id DESC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [OrgId, SpaceId]) of
                ok -> collect_project_rows(Stmt, []);
                _ -> []
            end;
        {error, _} -> []
    end.

collect_project_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, SpaceId, Name] ->
            collect_project_rows(Stmt, [{to_binary(Id), to_binary(SpaceId), to_binary(Name)} | Acc]);
        {row, {Id, SpaceId, Name}} ->
            collect_project_rows(Stmt, [{to_binary(Id), to_binary(SpaceId), to_binary(Name)} | Acc]);
        {row, [Id, SpaceId, Name]} ->
            collect_project_rows(Stmt, [{to_binary(Id), to_binary(SpaceId), to_binary(Name)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

select_recent_events(Db) ->
    Sql = <<"SELECT txid, kind, ts, payload_json FROM events ORDER BY txid DESC LIMIT 8">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_event_rows(Stmt, []);
        {error, _} -> []
    end.

collect_event_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Txid, Kind, Ts, Payload] ->
            collect_event_rows(Stmt, [{Txid, to_binary(Kind), to_binary(Ts), to_binary(Payload)} | Acc]);
        {row, {Txid, Kind, Ts, Payload}} ->
            collect_event_rows(Stmt, [{Txid, to_binary(Kind), to_binary(Ts), to_binary(Payload)} | Acc]);
        {row, [Txid, Kind, Ts, Payload]} ->
            collect_event_rows(Stmt, [{Txid, to_binary(Kind), to_binary(Ts), to_binary(Payload)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

org_json(Id, Name) ->
    [<<"{\"id\":\"">>, json_escape(Id), <<"\",\"name\":\"">>, json_escape(Name), <<"\"}">>].

space_json(Id, OrgId, Name, IsDefault) ->
    [
        <<"{\"id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"name\":\"">>, json_escape(Name), <<"\",">>,
        <<"\"is_default\":">>, IsDefault, <<"}">>
    ].

project_json(Id, SpaceId, Name) ->
    [
        <<"{\"id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"space_id\":\"">>, json_escape(SpaceId), <<"\",">>,
        <<"\"name\":\"">>, json_escape(Name), <<"\"}">>
    ].

current_org_json([]) ->
    <<"null">>;
current_org_json([{Id, Name} | _]) ->
    org_json(Id, Name).

current_space_json([]) ->
    <<"null">>;
current_space_json([{Id, OrgId, Name, IsDefault} | _]) ->
    space_json(Id, OrgId, Name, IsDefault).

current_project_json([]) ->
    <<"null">>;
current_project_json([{Id, SpaceId, Name} | _]) ->
    project_json(Id, SpaceId, Name).

event_summary_json(Txid, Kind, Ts, Payload) ->
    Label =
        case Kind of
            <<"org.created">> -> <<"Created organization ", (extract_json_string(Payload, <<"name">>))/binary>>;
            <<"space.created">> -> <<"Created space ", (extract_json_string(Payload, <<"name">>))/binary>>;
            <<"project.created">> -> <<"Created project ", (extract_json_string(Payload, <<"name">>))/binary>>;
            _ -> Kind
        end,
    [
        <<"{\"id\":\"event-tx-">>, integer_to_binary(Txid), <<"\",">>,
        <<"\"kind\":\"">>, json_escape(Kind), <<"\",">>,
        <<"\"label\":\"">>, json_escape(Label), <<"\",">>,
        <<"\"ts\":\"">>, json_escape(Ts), <<"\"}">>
    ].

join_json([]) ->
    <<>>;
join_json([One]) ->
    One;
join_json([One | Rest]) ->
    [One, <<",">>, join_json(Rest)].

extract_json_string(PayloadJson, Key) ->
    Payload = to_binary(PayloadJson),
    Pattern = iolist_to_binary([<<"\"">>, Key, <<"\":\"">>]),
    case binary:split(Payload, Pattern) of
        [_Before, After] ->
            hd(binary:split(After, <<"\"">>));
        _ ->
            <<>>
    end.

json_escape(Value) ->
    json_escape(to_binary(Value), []).

json_escape(<<>>, Acc) ->
    lists:reverse(Acc);
json_escape(<<"\\", Rest/binary>>, Acc) ->
    json_escape(Rest, [<<"\\\\">> | Acc]);
json_escape(<<"\"", Rest/binary>>, Acc) ->
    json_escape(Rest, [<<"\\\"">> | Acc]);
json_escape(<<"\n", Rest/binary>>, Acc) ->
    json_escape(Rest, [<<"\\n">> | Acc]);
json_escape(<<"\r", Rest/binary>>, Acc) ->
    json_escape(Rest, [<<"\\r">> | Acc]);
json_escape(<<"\t", Rest/binary>>, Acc) ->
    json_escape(Rest, [<<"\\t">> | Acc]);
json_escape(<<Char/utf8, Rest/binary>>, Acc) ->
    json_escape(Rest, [unicode:characters_to_binary([Char]) | Acc]).

classify_step(Row) when is_list(Row) ->
    {ok, {step_row, Row}};
classify_step({row, Row}) ->
    {ok, {step_row, Row}};
classify_step('$done') ->
    {ok, step_done};
classify_step({error, Reason}) ->
    {error, {sqlite_error, inspect_reason(Reason)}};
classify_step(Other) ->
    {error, {sqlite_error, inspect_reason(Other)}}.

inspect_reason(Reason) when is_binary(Reason) ->
    Reason;
inspect_reason(Reason) when is_atom(Reason) ->
    atom_to_binary(Reason, utf8);
inspect_reason(Reason) ->
    iolist_to_binary(io_lib:format("~p", [Reason])).
