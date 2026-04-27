%% SQLite helpers for the first BEAM-native live collaboration room.

-module(ema_collab_sqlite).
-export([
    init/1,
    open_document/4,
    write_body/6,
    frames_since/3,
    apply_frame/7,
    peer_cursor/3,
    mark_peer_applied/5
]).

init(Db) ->
    Ddl = <<"
        CREATE TABLE IF NOT EXISTS collab_documents (
          document_id TEXT PRIMARY KEY,
          body TEXT NOT NULL,
          revision INTEGER NOT NULL,
          updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS collab_update_frames (
          seq INTEGER PRIMARY KEY AUTOINCREMENT,
          frame_id TEXT,
          document_id TEXT NOT NULL,
          revision INTEGER NOT NULL,
          kind TEXT NOT NULL,
          actor TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS collab_peer_cursors (
          peer_device_id TEXT NOT NULL,
          document_id TEXT NOT NULL,
          last_revision INTEGER NOT NULL,
          last_frame_id TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (peer_device_id, document_id)
        );
    ">>,
    case exec(Db, Ddl) of
        {ok, nil} ->
            _ = exec(Db, <<"ALTER TABLE collab_update_frames ADD COLUMN frame_id TEXT">>),
            exec(Db, <<"CREATE UNIQUE INDEX IF NOT EXISTS collab_update_frames_frame_id_idx
                        ON collab_update_frames(frame_id)
                        WHERE frame_id IS NOT NULL">>);
        Error ->
            Error
    end.

open_document(Db, DocumentId, ActorId, Now) ->
    DocId = to_binary(DocumentId),
    Actor = to_binary(ActorId),
    Stamp = to_binary(Now),
    case select_document(Db, DocId) of
        {ok, _Doc} ->
            projection_json(Db, DocId);
        not_found ->
            Sql = <<"INSERT INTO collab_documents
                     (document_id, body, revision, updated_at, updated_by)
                     VALUES (?1, '', 0, ?2, ?3)">>,
            case exec_bound(Db, Sql, [DocId, Stamp, Actor]) of
                {ok, nil} -> projection_json(Db, DocId);
                Error -> Error
            end;
        Error ->
            Error
    end.

write_body(Db, DocumentId, Body, ActorId, Kind, Now) ->
    DocId = to_binary(DocumentId),
    Text = to_binary(Body),
    Actor = to_binary(ActorId),
    WriteKind = to_binary(Kind),
    Stamp = to_binary(Now),
    case open_document(Db, DocId, Actor, Stamp) of
        {ok, _} ->
            case select_document(Db, DocId) of
                {ok, {_Id, _Body, Revision, _UpdatedAt, _UpdatedBy}} ->
                    NewRevision = Revision + 1,
                    FrameId = frame_id(DocId, NewRevision, Stamp),
                    UpdateSql = <<"UPDATE collab_documents
                                    SET body = ?2, revision = ?3, updated_at = ?4, updated_by = ?5
                                    WHERE document_id = ?1">>,
                    FrameSql = <<"INSERT INTO collab_update_frames
                                  (frame_id, document_id, revision, kind, actor, body, created_at)
                                  VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)">>,
                    case begin_tx(Db) of
                        {ok, nil} ->
                            case exec_bound(Db, UpdateSql, [DocId, Text, NewRevision, Stamp, Actor]) of
                                {ok, nil} ->
                                    case exec_bound(Db, FrameSql, [FrameId, DocId, NewRevision, WriteKind, Actor, Text, Stamp]) of
                                        {ok, nil} ->
                                            case projection_json(Db, DocId) of
                                                {ok, Json} ->
                                                    commit_tx(Db, {ok, {Json, FrameId}});
                                                Error ->
                                                    rollback_tx(Db, Error)
                                            end;
                                        Error ->
                                            rollback_tx(Db, Error)
                                    end;
                                Error ->
                                    rollback_tx(Db, Error)
                            end;
                        Error ->
                            Error
                    end;
                Error ->
                    Error
            end;
        Error ->
            Error
    end.

frames_since(Db, DocumentId, AfterRevision) ->
    DocId = to_binary(DocumentId),
    Since = to_integer(AfterRevision),
    case open_document(Db, DocId, <<"system:ema_collab">>, <<"">>) of
        {ok, _} ->
            Frames = select_frames_since(Db, DocId, Since),
            {ok, iolist_to_binary([
                <<"{\"document_id\":\"">>, json_escape(DocId), <<"\",">>,
                <<"\"target\":{\"kind\":\"blueprint_section\",\"id\":\"">>, json_escape(DocId), <<"\"},">>,
                <<"\"after_revision\":">>, integer_to_binary(Since), <<",">>,
                <<"\"frames\":[">>, join_json([frame_json(Frame) || Frame <- Frames]), <<"]}">>
            ])};
        Error ->
            Error
    end.

apply_frame(Db, DocumentId, FrameId, Revision, Body, ActorId, CreatedAt) ->
    DocId = to_binary(DocumentId),
    IncomingFrameId = to_binary(FrameId),
    IncomingRevision = to_integer(Revision),
    Text = to_binary(Body),
    Actor = to_binary(ActorId),
    Stamp = to_binary(CreatedAt),
    case frame_exists(Db, IncomingFrameId) of
        true ->
            case projection_json(Db, DocId) of
                {ok, Json} -> {ok, {Json, IncomingFrameId}};
                Error -> Error
            end;
        false ->
            case open_document(Db, DocId, Actor, Stamp) of
                {ok, _} ->
                    CurrentRevision = current_revision(Db, DocId),
                    case IncomingRevision == CurrentRevision + 1 of
                        true ->
                            insert_applied_frame(
                                Db,
                                DocId,
                                IncomingFrameId,
                                IncomingRevision,
                                Text,
                                Actor,
                                Stamp
                            );
                        false ->
                            {error, {collab_revision_gap, {expected, CurrentRevision + 1}, {got, IncomingRevision}}}
                    end;
                Error ->
                    Error
            end
    end.

peer_cursor(Db, PeerDeviceId, DocumentId) ->
    Peer = to_binary(PeerDeviceId),
    DocId = to_binary(DocumentId),
    case select_peer_cursor(Db, Peer, DocId) of
        {ok, {LastRevision, LastFrameId, UpdatedAt}} ->
            {ok, peer_cursor_json(Peer, DocId, LastRevision, LastFrameId, UpdatedAt)};
        not_found ->
            {ok, peer_cursor_json(Peer, DocId, 0, <<>>, <<>>)};
        Error ->
            Error
    end.

mark_peer_applied(Db, PeerDeviceId, DocumentId, Revision, FrameId) ->
    Peer = to_binary(PeerDeviceId),
    DocId = to_binary(DocumentId),
    LastRevision = to_integer(Revision),
    LastFrameId = to_binary(FrameId),
    Now = ema_time_ffi:iso_now(),
    case frame_matches_revision(Db, DocId, LastRevision, LastFrameId) of
        true ->
            Sql = <<"INSERT INTO collab_peer_cursors
                     (peer_device_id, document_id, last_revision, last_frame_id, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5)
                     ON CONFLICT(peer_device_id, document_id) DO UPDATE SET
                       last_revision = CASE
                         WHEN excluded.last_revision > collab_peer_cursors.last_revision
                         THEN excluded.last_revision ELSE collab_peer_cursors.last_revision END,
                       last_frame_id = CASE
                         WHEN excluded.last_revision >= collab_peer_cursors.last_revision
                         THEN excluded.last_frame_id ELSE collab_peer_cursors.last_frame_id END,
                       updated_at = CASE
                         WHEN excluded.last_revision >= collab_peer_cursors.last_revision
                         THEN excluded.updated_at ELSE collab_peer_cursors.updated_at END">>,
            case exec_bound(Db, Sql, [Peer, DocId, LastRevision, LastFrameId, Now]) of
                {ok, nil} -> peer_cursor(Db, Peer, DocId);
                Error -> Error
            end;
        false ->
            {error, {collab_cursor_unknown_frame, DocId, LastRevision, LastFrameId}}
    end.

insert_applied_frame(Db, DocId, FrameId, Revision, Body, Actor, CreatedAt) ->
    UpdateSql = <<"UPDATE collab_documents
                    SET body = ?2, revision = ?3, updated_at = ?4, updated_by = ?5
                    WHERE document_id = ?1">>,
    FrameSql = <<"INSERT INTO collab_update_frames
                  (frame_id, document_id, revision, kind, actor, body, created_at)
                  VALUES (?1, ?2, ?3, 'replace', ?4, ?5, ?6)">>,
    case begin_tx(Db) of
        {ok, nil} ->
            case exec_bound(Db, FrameSql, [FrameId, DocId, Revision, Actor, Body, CreatedAt]) of
                {ok, nil} ->
                    case exec_bound(Db, UpdateSql, [DocId, Body, Revision, CreatedAt, Actor]) of
                        {ok, nil} ->
                            case projection_json(Db, DocId) of
                                {ok, Json} -> commit_tx(Db, {ok, {Json, FrameId}});
                                Error -> rollback_tx(Db, Error)
                            end;
                        Error -> rollback_tx(Db, Error)
                    end;
                Error -> rollback_tx(Db, Error)
            end;
        Error -> Error
    end.

projection_json(Db, DocId) ->
    case select_document(Db, DocId) of
        {ok, {Id, Body, Revision, UpdatedAt, UpdatedBy}} ->
            FrameCount = update_frame_count(Db, Id),
            {ok, iolist_to_binary([
                <<"{\"target\":{\"kind\":\"blueprint_section\",\"id\":\"">>, json_escape(Id), <<"\"},">>,
                <<"\"document_id\":\"">>, json_escape(Id), <<"\",">>,
                <<"\"title\":\"Blueprint live section\",">>,
                <<"\"text\":\"">>, json_escape(Body), <<"\",">>,
                <<"\"body\":\"">>, json_escape(Body), <<"\",">>,
                <<"\"revision\":">>, integer_to_binary(Revision), <<",">>,
                <<"\"version\":">>, integer_to_binary(Revision), <<",">>,
                <<"\"status\":\"live\",">>,
                <<"\"authority\":\"beam\",">>,
                <<"\"storage_authority\":\"daemon_sqlite\",">>,
                <<"\"updated_at\":\"">>, json_escape(UpdatedAt), <<"\",">>,
                <<"\"updated_by\":\"">>, json_escape(UpdatedBy), <<"\",">>,
                <<"\"presence\":[],">>,
                <<"\"update_frame_count\":">>, integer_to_binary(FrameCount), <<"}">>
            ])};
        Error ->
            Error
    end.

current_revision(Db, DocId) ->
    case select_document(Db, DocId) of
        {ok, {_Id, _Body, Revision, _UpdatedAt, _UpdatedBy}} -> Revision;
        _ -> 0
    end.

select_document(Db, DocId) ->
    Sql = <<"SELECT document_id, body, revision, updated_at, updated_by
             FROM collab_documents WHERE document_id = ?1 LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [DocId]) of
                ok ->
                    case esqlite3:step(Stmt) of
                        [Id, Body, Revision, UpdatedAt, UpdatedBy] ->
                            {ok, {to_binary(Id), to_binary(Body), Revision, to_binary(UpdatedAt), to_binary(UpdatedBy)}};
                        {row, {Id, Body, Revision, UpdatedAt, UpdatedBy}} ->
                            {ok, {to_binary(Id), to_binary(Body), Revision, to_binary(UpdatedAt), to_binary(UpdatedBy)}};
                        {row, [Id, Body, Revision, UpdatedAt, UpdatedBy]} ->
                            {ok, {to_binary(Id), to_binary(Body), Revision, to_binary(UpdatedAt), to_binary(UpdatedBy)}};
                        '$done' ->
                            not_found;
                        Other ->
                            {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Other)}}
                    end;
                {error, Reason} ->
                    {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}};
                Other ->
                    {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Other)}}
            end;
        {error, Reason} ->
            {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

select_frames_since(Db, DocId, AfterRevision) ->
    Sql = <<"SELECT seq, frame_id, revision, kind, actor, body, created_at
             FROM collab_update_frames
             WHERE document_id = ?1 AND revision > ?2
             ORDER BY revision ASC, seq ASC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [DocId, AfterRevision]) of
                ok -> collect_frame_rows(Stmt, DocId, []);
                _ -> []
            end;
        _ -> []
    end.

collect_frame_rows(Stmt, DocId, Acc) ->
    case esqlite3:step(Stmt) of
        [Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt] ->
            collect_frame_rows(Stmt, DocId, [frame_tuple(DocId, Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt) | Acc]);
        {row, {Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt}} ->
            collect_frame_rows(Stmt, DocId, [frame_tuple(DocId, Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt) | Acc]);
        {row, [Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt]} ->
            collect_frame_rows(Stmt, DocId, [frame_tuple(DocId, Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt) | Acc]);
        '$done' ->
            lists:reverse(Acc);
        _ ->
            lists:reverse(Acc)
    end.

frame_tuple(DocId, Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt) ->
    {
        to_binary(DocId),
        to_integer(Seq),
        frame_id_or_seq(FrameId, Seq),
        to_integer(Revision),
        to_binary(Kind),
        to_binary(Actor),
        to_binary(Body),
        to_binary(CreatedAt)
    }.

frame_exists(Db, FrameId) ->
    Sql = <<"SELECT 1 FROM collab_update_frames WHERE frame_id = ?1 LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [FrameId]) of
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

frame_matches_revision(Db, DocId, Revision, FrameId) ->
    Sql = <<"SELECT 1 FROM collab_update_frames
             WHERE document_id = ?1 AND revision = ?2 AND frame_id = ?3
             LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [DocId, Revision, FrameId]) of
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

select_peer_cursor(Db, PeerDeviceId, DocId) ->
    Sql = <<"SELECT last_revision, last_frame_id, updated_at
             FROM collab_peer_cursors
             WHERE peer_device_id = ?1 AND document_id = ?2
             LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [PeerDeviceId, DocId]) of
                ok ->
                    case esqlite3:step(Stmt) of
                        [LastRevision, LastFrameId, UpdatedAt] ->
                            {ok, {to_integer(LastRevision), to_binary(LastFrameId), to_binary(UpdatedAt)}};
                        {row, {LastRevision, LastFrameId, UpdatedAt}} ->
                            {ok, {to_integer(LastRevision), to_binary(LastFrameId), to_binary(UpdatedAt)}};
                        {row, [LastRevision, LastFrameId, UpdatedAt]} ->
                            {ok, {to_integer(LastRevision), to_binary(LastFrameId), to_binary(UpdatedAt)}};
                        '$done' ->
                            not_found;
                        Other ->
                            {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Other)}}
                    end;
                {error, Reason} ->
                    {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}};
                Other ->
                    {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Other)}}
            end;
        {error, Reason} ->
            {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

update_frame_count(Db, DocId) ->
    Sql = <<"SELECT COUNT(*) FROM collab_update_frames WHERE document_id = ?1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [DocId]) of
                ok ->
                    case esqlite3:step(Stmt) of
                        [Count] -> Count;
                        {row, {Count}} -> Count;
                        {row, [Count]} -> Count;
                        _ -> 0
                    end;
                _ -> 0
            end;
        _ -> 0
    end.

frame_json({DocId, Seq, FrameId, Revision, Kind, Actor, Body, CreatedAt}) ->
    [
        <<"{\"seq\":">>, integer_to_binary(Seq), <<",">>,
        <<"\"frame_id\":\"">>, json_escape(FrameId), <<"\",">>,
        <<"\"target\":{\"kind\":\"blueprint_section\",\"id\":\"">>, json_escape(DocId), <<"\"},">>,
        <<"\"document_id\":\"">>, json_escape(DocId), <<"\",">>,
        <<"\"revision\":">>, integer_to_binary(Revision), <<",">>,
        <<"\"kind\":\"">>, json_escape(Kind), <<"\",">>,
        <<"\"actor\":\"">>, json_escape(Actor), <<"\",">>,
        <<"\"text\":\"">>, json_escape(Body), <<"\",">>,
        <<"\"body\":\"">>, json_escape(Body), <<"\",">>,
        <<"\"text_sha256\":\"">>, sha256_hex(Body), <<"\",">>,
        <<"\"created_at\":\"">>, json_escape(CreatedAt), <<"\"}">>
    ].

peer_cursor_json(PeerDeviceId, DocId, LastRevision, LastFrameId, UpdatedAt) ->
    iolist_to_binary([
        <<"{\"peer_device_id\":\"">>, json_escape(PeerDeviceId), <<"\",">>,
        <<"\"document_id\":\"">>, json_escape(DocId), <<"\",">>,
        <<"\"target\":{\"kind\":\"blueprint_section\",\"id\":\"">>, json_escape(DocId), <<"\"},">>,
        <<"\"last_revision\":">>, integer_to_binary(LastRevision), <<",">>,
        <<"\"last_frame_id\":\"">>, json_escape(LastFrameId), <<"\",">>,
        <<"\"updated_at\":\"">>, json_escape(UpdatedAt), <<"\"}">>
    ]).

join_json([]) ->
    <<>>;
join_json([One]) ->
    One;
join_json([One | Rest]) ->
    [One, <<",">>, join_json(Rest)].

exec(Db, Sql) ->
    case esqlite3:exec(Db, Sql) of
        ok -> {ok, nil};
        {error, Reason} -> {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}};
        Other -> {ok, Other}
    end.

exec_bound(Db, Sql, Args) ->
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, Args) of
                ok ->
                    case esqlite3:step(Stmt) of
                        '$done' -> {ok, nil};
                        {row, _} -> {ok, nil};
                        {error, Reason} -> {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}};
                        Other -> {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Other)}}
                    end;
                {error, Reason} ->
                    {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}};
                Other ->
                    {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Other)}}
            end;
        {error, Reason} ->
            {error, {collab_sqlite_error, ema_sqlite_helpers:inspect_reason(Reason)}}
    end.

begin_tx(Db) ->
    exec(Db, <<"BEGIN IMMEDIATE">>).

commit_tx(Db, Result) ->
    case exec(Db, <<"COMMIT">>) of
        {ok, nil} -> Result;
        Error -> Error
    end.

rollback_tx(Db, Error) ->
    _ = exec(Db, <<"ROLLBACK">>),
    Error.

to_binary(V) when is_binary(V) -> V;
to_binary(nil) -> <<>>;
to_binary(V) when is_integer(V) -> integer_to_binary(V);
to_binary(V) when is_list(V) -> iolist_to_binary(V).

to_integer(V) when is_integer(V) -> V;
to_integer(V) when is_binary(V) ->
    case string:to_integer(binary_to_list(V)) of
        {I, _Rest} -> I;
        _ -> 0
    end;
to_integer(V) when is_list(V) ->
    case string:to_integer(V) of
        {I, _Rest} -> I;
        _ -> 0
    end;
to_integer(_) -> 0.

frame_id(_DocId, _Revision, _Stamp) ->
    <<"collab_frame:", (ema_time_ffi:ulid())/binary>>.

frame_id_or_seq(nil, Seq) ->
    <<"collab_frame:", (integer_to_binary(to_integer(Seq)))/binary>>;
frame_id_or_seq(<<>>, Seq) ->
    <<"collab_frame:", (integer_to_binary(to_integer(Seq)))/binary>>;
frame_id_or_seq(FrameId, _Seq) ->
    to_binary(FrameId).

sha256_hex(Value) ->
    Bytes = crypto:hash(sha256, to_binary(Value)),
    << <<(hex_digit(Nibble))/integer>> || <<Nibble:4>> <= Bytes >>.

hex_digit(N) when N < 10 ->
    $0 + N;
hex_digit(N) ->
    $a + (N - 10).

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
