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
    persist_identity_user_upserted/3,
    persist_identity_google_linked/3,
    persist_identity_authenticator_enabled/3,
    persist_device_registered/5,
    persist_device_renamed/4,
    persist_device_revoked/4,
    persist_device_key_rotated/4,
    persist_peer_trust_established/5,
    persist_peer_trust_revoked/5,
    persist_membership_role_granted/5,
    persist_membership_role_revoked/5,
    persist_membership_removed/5,
    persist_invite_created/5,
    persist_invite_status/5,
    persist_access_session_challenge_created/3,
    persist_access_session_approved/3,
    persist_access_session_status/4,
    topbar_projection_json/1,
    event_trail_projection_json/1,
    access_session_projection_json/1,
    device_projection_json/1,
    peer_trust_projection_json/1,
    peer_is_trusted/3,
    collab_open_document/5,
    collab_replace_document/5,
    collab_document_projection_json/2,
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

persist_identity_user_upserted(Db, PayloadJson, UpdatedAt) ->
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    DisplayName = extract_json_string(PayloadJson, <<"display_name">>),
    Email = extract_json_string(PayloadJson, <<"email">>),
    EmailVerified =
        case binary:match(to_binary(PayloadJson), <<"\"email_verified\":true">>) of
            nomatch -> <<"false">>;
            _ -> <<"true">>
        end,
    Sql = <<"INSERT OR REPLACE INTO users
             (id, display_name, email, email_verified, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)">>,
    exec_bound(Db, Sql, [UserId, DisplayName, Email, EmailVerified, UpdatedAt]).

persist_identity_google_linked(Db, PayloadJson, UpdatedAt) ->
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    GoogleSub = extract_json_string(PayloadJson, <<"google_sub">>),
    Email = extract_json_string(PayloadJson, <<"email">>),
    EmailVerified =
        case binary:match(to_binary(PayloadJson), <<"\"email_verified\":true">>) of
            nomatch -> <<"false">>;
            _ -> <<"true">>
        end,
    LinkedAt =
        case extract_json_string(PayloadJson, <<"linked_at">>) of
            <<>> -> UpdatedAt;
            V -> V
        end,
    Sql = <<"INSERT OR REPLACE INTO google_identities
             (google_sub, user_id, email, email_verified, linked_at)
             VALUES (?1, ?2, ?3, ?4, ?5)">>,
    exec_bound(Db, Sql, [GoogleSub, UserId, Email, EmailVerified, LinkedAt]).

persist_identity_authenticator_enabled(Db, PayloadJson, UpdatedAt) ->
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    Method = extract_json_string(PayloadJson, <<"method">>),
    SecretRef = extract_json_string(PayloadJson, <<"secret_ref">>),
    VerifiedAt =
        case extract_json_string(PayloadJson, <<"verified_at">>) of
            <<>> -> UpdatedAt;
            V -> V
        end,
    Sql = <<"INSERT OR REPLACE INTO authenticator_enrollments
             (user_id, method, secret_ref, status, verified_at)
             VALUES (?1, ?2, ?3, 'enabled', ?4)">>,
    exec_bound(Db, Sql, [UserId, Method, SecretRef, VerifiedAt]).

persist_device_registered(Db, OrgId, PayloadJson, UpdatedAt, Actor) ->
    DeviceId = extract_json_string(PayloadJson, <<"device_id">>),
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    Name = extract_json_string(PayloadJson, <<"name">>),
    Pubkey = extract_json_string(PayloadJson, <<"pubkey">>),
    Bootstrap = extract_json_string(PayloadJson, <<"bootstrap">>),
    Sql = <<"INSERT OR REPLACE INTO devices
             (id, org_id, user_id, name, pubkey, bootstrap, status, updated_at, updated_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'trusted', ?7, ?8)">>,
    exec_bound(Db, Sql, [DeviceId, OrgId, UserId, Name, Pubkey, Bootstrap, UpdatedAt, Actor]).

persist_device_renamed(Db, PayloadJson, UpdatedAt, Actor) ->
    DeviceId = extract_json_string(PayloadJson, <<"device_id">>),
    Name =
        case extract_json_string(PayloadJson, <<"to">>) of
            <<>> -> extract_json_string(PayloadJson, <<"name">>);
            V -> V
        end,
    Sql = <<"UPDATE devices
             SET name = ?2, updated_at = ?3, updated_by = ?4
             WHERE id = ?1">>,
    exec_bound(Db, Sql, [DeviceId, Name, UpdatedAt, Actor]).

persist_device_revoked(Db, PayloadJson, UpdatedAt, Actor) ->
    DeviceId = extract_json_string(PayloadJson, <<"device_id">>),
    Sql = <<"UPDATE devices
             SET status = 'revoked', updated_at = ?2, updated_by = ?3
             WHERE id = ?1">>,
    exec_bound(Db, Sql, [DeviceId, UpdatedAt, Actor]).

persist_device_key_rotated(Db, PayloadJson, UpdatedAt, Actor) ->
    DeviceId = extract_json_string(PayloadJson, <<"device_id">>),
    Pubkey = extract_json_string(PayloadJson, <<"new_pubkey">>),
    Sql = <<"UPDATE devices
             SET pubkey = ?2, updated_at = ?3, updated_by = ?4
             WHERE id = ?1">>,
    exec_bound(Db, Sql, [DeviceId, Pubkey, UpdatedAt, Actor]).

persist_peer_trust_established(Db, OrgId, PayloadJson, UpdatedAt, Actor) ->
    PeerDevice = extract_json_string(PayloadJson, <<"peer_device">>),
    PeerPubkey = extract_json_string(PayloadJson, <<"peer_pubkey">>),
    LocalPubkey = extract_json_string(PayloadJson, <<"local_pubkey">>),
    CeremonyKind = extract_json_string(PayloadJson, <<"ceremony_kind">>),
    CeremonyId = extract_json_string(PayloadJson, <<"ceremony_id">>),
    EstablishedAt =
        case extract_json_string(PayloadJson, <<"established_at">>) of
            <<>> -> UpdatedAt;
            V -> V
        end,
    LineageProof = extract_json_string(PayloadJson, <<"lineage_proof">>),
    Sql = <<"INSERT OR REPLACE INTO peer_trust
             (org_id, peer_device, peer_pubkey, local_pubkey, ceremony_kind, ceremony_id, lineage_proof, status, established_at, updated_at, updated_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'trusted', ?8, ?9, ?10)">>,
    exec_bound(Db, Sql, [OrgId, PeerDevice, PeerPubkey, LocalPubkey, CeremonyKind, CeremonyId, LineageProof, EstablishedAt, UpdatedAt, Actor]).

persist_peer_trust_revoked(Db, OrgId, PayloadJson, UpdatedAt, Actor) ->
    PeerDevice = extract_json_string(PayloadJson, <<"peer_device">>),
    Sql = <<"UPDATE peer_trust
             SET status = 'revoked', updated_at = ?3, updated_by = ?4
             WHERE org_id = ?1 AND peer_device = ?2">>,
    exec_bound(Db, Sql, [OrgId, PeerDevice, UpdatedAt, Actor]).

persist_membership_role_granted(Db, OrgId, PayloadJson, UpdatedAt, Actor) ->
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    Role = extract_json_string(PayloadJson, <<"role">>),
    Sql = <<"INSERT OR REPLACE INTO memberships
             (org_id, user_id, role, status, updated_at, updated_by)
             VALUES (?1, ?2, ?3, 'active', ?4, ?5)">>,
    exec_bound(Db, Sql, [OrgId, UserId, Role, UpdatedAt, Actor]).

persist_membership_role_revoked(Db, OrgId, PayloadJson, UpdatedAt, Actor) ->
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    Role = extract_json_string(PayloadJson, <<"role">>),
    Sql = <<"UPDATE memberships
             SET status = 'revoked', updated_at = ?4, updated_by = ?5
             WHERE org_id = ?1 AND user_id = ?2 AND role = ?3">>,
    exec_bound(Db, Sql, [OrgId, UserId, Role, UpdatedAt, Actor]).

persist_membership_removed(Db, OrgId, PayloadJson, UpdatedAt, Actor) ->
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    Sql = <<"UPDATE memberships
             SET status = 'removed', updated_at = ?3, updated_by = ?4
             WHERE org_id = ?1 AND user_id = ?2">>,
    exec_bound(Db, Sql, [OrgId, UserId, UpdatedAt, Actor]).

persist_invite_created(Db, OrgId, PayloadJson, UpdatedAt, Actor) ->
    InviteId = extract_json_string(PayloadJson, <<"invite_id">>),
    TargetKind = extract_json_string(PayloadJson, <<"kind">>),
    TargetValue = extract_json_string(PayloadJson, <<"value">>),
    Role = extract_json_string(PayloadJson, <<"role">>),
    ExpiresAt = extract_json_string(PayloadJson, <<"expires_at">>),
    Sql = <<"INSERT OR REPLACE INTO invites
             (id, org_id, target_kind, target_value, role, status, expires_at, updated_at, updated_by)
             VALUES (?1, ?2, ?3, ?4, ?5, 'open', ?6, ?7, ?8)">>,
    exec_bound(Db, Sql, [InviteId, OrgId, TargetKind, TargetValue, Role, ExpiresAt, UpdatedAt, Actor]).

persist_invite_status(Db, PayloadJson, Status, UpdatedAt, Actor) ->
    InviteId = extract_json_string(PayloadJson, <<"invite_id">>),
    Sql = <<"UPDATE invites SET status = ?2, updated_at = ?3, updated_by = ?4 WHERE id = ?1">>,
    exec_bound(Db, Sql, [InviteId, Status, UpdatedAt, Actor]).

persist_access_session_challenge_created(Db, PayloadJson, UpdatedAt) ->
    ChallengeId = extract_json_string(PayloadJson, <<"challenge_id">>),
    OrgId = extract_json_string(PayloadJson, <<"org_id">>),
    AccessPoint = extract_json_string(PayloadJson, <<"access_point">>),
    UserCode = extract_json_string(PayloadJson, <<"user_code">>),
    ScopesJson = extract_json_array(PayloadJson, <<"scopes">>),
    ExpiresAt = extract_json_string(PayloadJson, <<"expires_at">>),
    Sql = <<"INSERT OR REPLACE INTO access_session_challenges
             (id, org_id, access_point, user_code, scopes_json, status, expires_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 'open', ?6, ?7)">>,
    exec_bound(Db, Sql, [ChallengeId, OrgId, AccessPoint, UserCode, ScopesJson, ExpiresAt, UpdatedAt]).

persist_access_session_approved(Db, PayloadJson, UpdatedAt) ->
    ChallengeId = extract_json_string(PayloadJson, <<"challenge_id">>),
    SessionId = extract_json_string(PayloadJson, <<"session_id">>),
    OrgId = extract_json_string(PayloadJson, <<"org_id">>),
    UserId = extract_json_string(PayloadJson, <<"user_id">>),
    ApprovedByDevice = extract_json_string(PayloadJson, <<"approved_by_device">>),
    ScopesJson = extract_json_array(PayloadJson, <<"scopes">>),
    TokenHashRef = extract_json_string(PayloadJson, <<"token_hash_ref">>),
    ExpiresAt = extract_json_string(PayloadJson, <<"expires_at">>),
    UpdateChallengeSql = <<"UPDATE access_session_challenges SET status = 'approved', updated_at = ?2 WHERE id = ?1">>,
    SessionSql = <<"INSERT OR REPLACE INTO access_sessions
             (id, challenge_id, org_id, user_id, approved_by_device, scopes_json, token_hash_ref, status, expires_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'active', ?8, ?9)">>,
    case exec_bound(Db, UpdateChallengeSql, [ChallengeId, UpdatedAt]) of
        {ok, nil} -> exec_bound(Db, SessionSql, [SessionId, ChallengeId, OrgId, UserId, ApprovedByDevice, ScopesJson, TokenHashRef, ExpiresAt, UpdatedAt]);
        Error -> Error
    end.

persist_access_session_status(Db, PayloadJson, Status, UpdatedAt) ->
    SessionId = extract_json_string(PayloadJson, <<"session_id">>),
    Sql = <<"UPDATE access_sessions SET status = ?2, updated_at = ?3 WHERE id = ?1">>,
    exec_bound(Db, Sql, [SessionId, Status, UpdatedAt]).

collab_open_document(Db, DocumentId, Title, UpdatedAt, UpdatedBy) ->
    Sql = <<"INSERT OR IGNORE INTO collab_documents
             (id, title, body, version, updated_at, updated_by)
             VALUES (?1, ?2, '', 0, ?3, ?4)">>,
    exec_bound(Db, Sql, [DocumentId, Title, UpdatedAt, UpdatedBy]).

collab_replace_document(Db, DocumentId, Body, UpdatedAt, UpdatedBy) ->
    case ensure_collab_document(Db, DocumentId, UpdatedAt, UpdatedBy) of
        {ok, nil} ->
            Version = current_collab_version(Db, DocumentId) + 1,
            UpdateSql = <<"UPDATE collab_documents
                           SET body = ?2, version = ?3, updated_at = ?4, updated_by = ?5
                           WHERE id = ?1">>,
            case exec_bound(Db, UpdateSql, [DocumentId, Body, integer_to_binary(Version), UpdatedAt, UpdatedBy]) of
                {ok, nil} ->
                    InsertSql = <<"INSERT INTO collab_updates
                                   (document_id, version, body, updated_at, updated_by)
                                   VALUES (?1, ?2, ?3, ?4, ?5)">>,
                    exec_bound(Db, InsertSql, [DocumentId, integer_to_binary(Version), Body, UpdatedAt, UpdatedBy]);
                Error -> Error
            end;
        Error -> Error
    end.

ensure_collab_document(Db, DocumentId, UpdatedAt, UpdatedBy) ->
    collab_open_document(Db, DocumentId, <<"Untitled EMA document">>, UpdatedAt, UpdatedBy).

current_collab_version(Db, DocumentId) ->
    Sql = <<"SELECT version FROM collab_documents WHERE id = ?1 LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [DocumentId]) of
                ok ->
                    case esqlite3:step(Stmt) of
                        [Version] -> to_integer(Version);
                        {row, {Version}} -> to_integer(Version);
                        {row, [Version]} -> to_integer(Version);
                        _ -> 0
                    end;
                _ -> 0
            end;
        _ -> 0
    end.

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
    UserId = <<"user:dev-local">>,
    Orgs = select_orgs_for_user(Db, UserId),
    CurrentOrgId = current_org_id(Orgs),
    Spaces = select_spaces(Db, CurrentOrgId),
    CurrentSpaceId = current_space_id(Spaces),
    Projects = select_projects(Db, CurrentOrgId, CurrentSpaceId),
    Memberships = select_memberships(Db, CurrentOrgId),
    Current = current_org_json(Orgs),
    CurrentSpace = current_space_json(Spaces),
    CurrentProject = current_project_json(Projects),
    OrgArray = join_json([org_json(Id, Name) || {Id, Name} <- Orgs]),
    SpaceArray = join_json([space_json(Id, OrgId, Name, IsDefault) || {Id, OrgId, Name, IsDefault} <- Spaces]),
    ProjectArray = join_json([project_json(Id, SpaceId, Name) || {Id, SpaceId, Name} <- Projects]),
    MembershipArray = join_json([membership_json(User, Role, Status) || {User, Role, Status} <- Memberships]),
    iolist_to_binary([
        <<"{\"user\":{\"id\":\"user:dev-local\",\"display_name\":\"Dev Operator\"},">>,
        <<"\"orgs\":[">>, OrgArray, <<"],">>,
        <<"\"current_org\":">>, Current, <<",">>,
        <<"\"spaces\":[">>, SpaceArray, <<"],">>,
        <<"\"current_space\":">>, CurrentSpace, <<",">>,
        <<"\"projects\":[">>, ProjectArray, <<"],">>,
        <<"\"current_project\":">>, CurrentProject, <<",">>,
        <<"\"memberships\":[">>, MembershipArray, <<"],">>,
        <<"\"node_state\":\"home_current\"}">>
    ]).

event_trail_projection_json(Db) ->
    Events = select_recent_events(Db),
    Items = join_json([event_summary_json(Txid, Kind, Ts, Payload) || {Txid, Kind, Ts, Payload} <- Events]),
    iolist_to_binary([<<"{\"events\":[">>, Items, <<"]}">>]).

access_session_projection_json(Db) ->
    Challenges = select_access_challenges(Db),
    Sessions = select_access_sessions(Db),
    ChallengeArray = join_json([access_challenge_json(Id, OrgId, AccessPoint, UserCode, Scopes, Status, ExpiresAt) || {Id, OrgId, AccessPoint, UserCode, Scopes, Status, ExpiresAt} <- Challenges]),
    SessionArray = join_json([access_session_json(Id, ChallengeId, OrgId, UserId, Device, Scopes, Status, ExpiresAt) || {Id, ChallengeId, OrgId, UserId, Device, Scopes, Status, ExpiresAt} <- Sessions]),
    iolist_to_binary([
        <<"{\"challenges\":[">>, ChallengeArray, <<"],">>,
        <<"\"sessions\":[">>, SessionArray, <<"]}">>
    ]).

device_projection_json(Db) ->
    Devices = select_devices(Db),
    DeviceArray = join_json([device_json(Id, OrgId, UserId, Name, Pubkey, Bootstrap, Status, UpdatedAt) || {Id, OrgId, UserId, Name, Pubkey, Bootstrap, Status, UpdatedAt} <- Devices]),
    iolist_to_binary([
        <<"{\"devices\":[">>, DeviceArray, <<"],">>,
        <<"\"machine_peer_ready\":false,">>,
        <<"\"transport\":\"disabled\"}">>
    ]).

peer_trust_projection_json(Db) ->
    Peers = select_peer_trust(Db),
    PeerArray = join_json([peer_trust_json(OrgId, PeerDevice, PeerPubkey, LocalPubkey, CeremonyKind, CeremonyId, Status, EstablishedAt) || {OrgId, PeerDevice, PeerPubkey, LocalPubkey, CeremonyKind, CeremonyId, Status, EstablishedAt} <- Peers]),
    iolist_to_binary([
        <<"{\"peers\":[">>, PeerArray, <<"],">>,
        <<"\"replication_enabled\":false,">>,
        <<"\"transport\":\"disabled\"}">>
    ]).

peer_is_trusted(Db, OrgId, PeerDevice) ->
    Sql = <<"SELECT 1 FROM peer_trust
             WHERE org_id = ?1 AND peer_device = ?2 AND status = 'trusted'
             LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [OrgId, PeerDevice]) of
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

collab_document_projection_json(Db, DocumentId) ->
	    case select_collab_document(Db, DocumentId) of
	        {Id, Title, Body, Version, UpdatedAt, UpdatedBy} ->
	            iolist_to_binary([
	                <<"{\"target\":{\"kind\":\"blueprint_section\",\"id\":\"">>, json_escape(Id), <<"\"},">>,
	                <<"\"title\":\"">>, json_escape(Title), <<"\",">>,
	                <<"\"text\":\"">>, json_escape(Body), <<"\",">>,
	                <<"\"revision\":">>, integer_to_binary(to_integer(Version)), <<",">>,
	                <<"\"status\":\"live\",">>,
	                <<"\"authority\":\"beam\",">>,
	                <<"\"updated_at\":\"">>, json_escape(UpdatedAt), <<"\",">>,
	                <<"\"updated_by\":\"">>, json_escape(UpdatedBy), <<"\",">>,
	                <<"\"presence\":[]}">>
	            ]);
	        none ->
	            iolist_to_binary([
	                <<"{\"target\":{\"kind\":\"blueprint_section\",\"id\":\"">>, json_escape(DocumentId), <<"\"},">>,
	                <<"\"title\":\"EMA live document\",">>,
	                <<"\"text\":\"\",">>,
	                <<"\"revision\":0,">>,
	                <<"\"status\":\"live\",">>,
	                <<"\"authority\":\"beam\",">>,
	                <<"\"updated_at\":\"\",">>,
	                <<"\"updated_by\":\"\",">>,
	                <<"\"presence\":[]}">>
	            ])
    end.

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

to_charlist(V) when is_binary(V) -> binary_to_list(V);
to_charlist(V) when is_list(V) -> V.

select_orgs(Db) ->
    Sql = <<"SELECT id, name FROM orgs ORDER BY created_at DESC, id DESC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_org_rows(Stmt, []);
        {error, _} -> []
    end.

select_orgs_for_user(Db, UserId) ->
    Sql = <<"SELECT o.id, o.name FROM orgs o
             INNER JOIN memberships m ON m.org_id = o.id
             WHERE m.user_id = ?1 AND m.status = 'active'
             ORDER BY o.created_at DESC, o.id DESC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [UserId]) of
                ok ->
                    Rows = collect_org_rows(Stmt, []),
                    case Rows of
                        [] -> select_orgs(Db);
                        _ -> Rows
                    end;
                _ -> select_orgs(Db)
            end;
        {error, _} -> select_orgs(Db)
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

select_memberships(_Db, <<>>) ->
    [];
select_memberships(Db, OrgId) ->
    Sql = <<"SELECT user_id, role, status FROM memberships WHERE org_id = ?1 ORDER BY user_id, role">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [OrgId]) of
                ok -> collect_membership_rows(Stmt, []);
                _ -> []
            end;
        {error, _} -> []
    end.

collect_membership_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [UserId, Role, Status] ->
            collect_membership_rows(Stmt, [{to_binary(UserId), to_binary(Role), to_binary(Status)} | Acc]);
        {row, {UserId, Role, Status}} ->
            collect_membership_rows(Stmt, [{to_binary(UserId), to_binary(Role), to_binary(Status)} | Acc]);
        {row, [UserId, Role, Status]} ->
            collect_membership_rows(Stmt, [{to_binary(UserId), to_binary(Role), to_binary(Status)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

select_access_challenges(Db) ->
    Sql = <<"SELECT id, org_id, access_point, user_code, scopes_json, status, expires_at
             FROM access_session_challenges ORDER BY updated_at DESC LIMIT 5">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_access_challenge_rows(Stmt, []);
        {error, _} -> []
    end.

collect_access_challenge_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, OrgId, AccessPoint, UserCode, Scopes, Status, ExpiresAt] ->
            collect_access_challenge_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(AccessPoint), to_binary(UserCode), to_binary(Scopes), to_binary(Status), to_binary(ExpiresAt)} | Acc]);
        {row, {Id, OrgId, AccessPoint, UserCode, Scopes, Status, ExpiresAt}} ->
            collect_access_challenge_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(AccessPoint), to_binary(UserCode), to_binary(Scopes), to_binary(Status), to_binary(ExpiresAt)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

select_access_sessions(Db) ->
    Sql = <<"SELECT id, challenge_id, org_id, user_id, approved_by_device, scopes_json, status, expires_at
             FROM access_sessions ORDER BY updated_at DESC LIMIT 5">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_access_session_rows(Stmt, []);
        {error, _} -> []
    end.

collect_access_session_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, ChallengeId, OrgId, UserId, Device, Scopes, Status, ExpiresAt] ->
            collect_access_session_rows(Stmt, [{to_binary(Id), to_binary(ChallengeId), to_binary(OrgId), to_binary(UserId), to_binary(Device), to_binary(Scopes), to_binary(Status), to_binary(ExpiresAt)} | Acc]);
        {row, {Id, ChallengeId, OrgId, UserId, Device, Scopes, Status, ExpiresAt}} ->
            collect_access_session_rows(Stmt, [{to_binary(Id), to_binary(ChallengeId), to_binary(OrgId), to_binary(UserId), to_binary(Device), to_binary(Scopes), to_binary(Status), to_binary(ExpiresAt)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

select_devices(Db) ->
    Sql = <<"SELECT id, org_id, user_id, name, pubkey, bootstrap, status, updated_at
             FROM devices ORDER BY updated_at DESC, id DESC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_device_rows(Stmt, []);
        {error, _} -> []
    end.

collect_device_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, OrgId, UserId, Name, Pubkey, Bootstrap, Status, UpdatedAt] ->
            collect_device_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(UserId), to_binary(Name), to_binary(Pubkey), to_binary(Bootstrap), to_binary(Status), to_binary(UpdatedAt)} | Acc]);
        {row, {Id, OrgId, UserId, Name, Pubkey, Bootstrap, Status, UpdatedAt}} ->
            collect_device_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(UserId), to_binary(Name), to_binary(Pubkey), to_binary(Bootstrap), to_binary(Status), to_binary(UpdatedAt)} | Acc]);
        {row, [Id, OrgId, UserId, Name, Pubkey, Bootstrap, Status, UpdatedAt]} ->
            collect_device_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(UserId), to_binary(Name), to_binary(Pubkey), to_binary(Bootstrap), to_binary(Status), to_binary(UpdatedAt)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

select_peer_trust(Db) ->
    Sql = <<"SELECT org_id, peer_device, peer_pubkey, local_pubkey, ceremony_kind, ceremony_id, status, established_at
             FROM peer_trust ORDER BY updated_at DESC, peer_device DESC">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_peer_trust_rows(Stmt, []);
        {error, _} -> []
    end.

collect_peer_trust_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [OrgId, PeerDevice, PeerPubkey, LocalPubkey, CeremonyKind, CeremonyId, Status, EstablishedAt] ->
            collect_peer_trust_rows(Stmt, [{to_binary(OrgId), to_binary(PeerDevice), to_binary(PeerPubkey), to_binary(LocalPubkey), to_binary(CeremonyKind), to_binary(CeremonyId), to_binary(Status), to_binary(EstablishedAt)} | Acc]);
        {row, {OrgId, PeerDevice, PeerPubkey, LocalPubkey, CeremonyKind, CeremonyId, Status, EstablishedAt}} ->
            collect_peer_trust_rows(Stmt, [{to_binary(OrgId), to_binary(PeerDevice), to_binary(PeerPubkey), to_binary(LocalPubkey), to_binary(CeremonyKind), to_binary(CeremonyId), to_binary(Status), to_binary(EstablishedAt)} | Acc]);
        {row, [OrgId, PeerDevice, PeerPubkey, LocalPubkey, CeremonyKind, CeremonyId, Status, EstablishedAt]} ->
            collect_peer_trust_rows(Stmt, [{to_binary(OrgId), to_binary(PeerDevice), to_binary(PeerPubkey), to_binary(LocalPubkey), to_binary(CeremonyKind), to_binary(CeremonyId), to_binary(Status), to_binary(EstablishedAt)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

select_collab_document(Db, DocumentId) ->
    Sql = <<"SELECT id, title, body, version, updated_at, updated_by
             FROM collab_documents WHERE id = ?1 LIMIT 1">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [DocumentId]) of
                ok ->
                    case esqlite3:step(Stmt) of
                        [Id, Title, Body, Version, UpdatedAt, UpdatedBy] ->
                            {to_binary(Id), to_binary(Title), to_binary(Body), Version, to_binary(UpdatedAt), to_binary(UpdatedBy)};
                        {row, {Id, Title, Body, Version, UpdatedAt, UpdatedBy}} ->
                            {to_binary(Id), to_binary(Title), to_binary(Body), Version, to_binary(UpdatedAt), to_binary(UpdatedBy)};
                        {row, [Id, Title, Body, Version, UpdatedAt, UpdatedBy]} ->
                            {to_binary(Id), to_binary(Title), to_binary(Body), Version, to_binary(UpdatedAt), to_binary(UpdatedBy)};
                        _ -> none
                    end;
                _ -> none
            end;
        _ -> none
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

membership_json(UserId, Role, Status) ->
    [
        <<"{\"user_id\":\"">>, json_escape(UserId), <<"\",">>,
        <<"\"role\":\"">>, json_escape(Role), <<"\",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\"}">>
    ].

access_challenge_json(Id, OrgId, AccessPoint, UserCode, ScopesJson, Status, ExpiresAt) ->
    [
        <<"{\"challenge_id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"access_point\":\"">>, json_escape(AccessPoint), <<"\",">>,
        <<"\"user_code\":\"">>, json_escape(UserCode), <<"\",">>,
        <<"\"scopes\":">>, ScopesJson, <<",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\",">>,
        <<"\"expires_at\":\"">>, json_escape(ExpiresAt), <<"\"}">>
    ].

access_session_json(Id, ChallengeId, OrgId, UserId, Device, ScopesJson, Status, ExpiresAt) ->
    [
        <<"{\"session_id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"challenge_id\":\"">>, json_escape(ChallengeId), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"user_id\":\"">>, json_escape(UserId), <<"\",">>,
        <<"\"approved_by_device\":\"">>, json_escape(Device), <<"\",">>,
        <<"\"scopes\":">>, ScopesJson, <<",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\",">>,
        <<"\"expires_at\":\"">>, json_escape(ExpiresAt), <<"\"}">>
    ].

device_json(Id, OrgId, UserId, Name, Pubkey, Bootstrap, Status, UpdatedAt) ->
    [
        <<"{\"device_id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"user_id\":\"">>, json_escape(UserId), <<"\",">>,
        <<"\"name\":\"">>, json_escape(Name), <<"\",">>,
        <<"\"pubkey\":\"">>, json_escape(Pubkey), <<"\",">>,
        <<"\"bootstrap\":\"">>, json_escape(Bootstrap), <<"\",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\",">>,
        <<"\"updated_at\":\"">>, json_escape(UpdatedAt), <<"\"}">>
    ].

peer_trust_json(OrgId, PeerDevice, PeerPubkey, LocalPubkey, CeremonyKind, CeremonyId, Status, EstablishedAt) ->
    [
        <<"{\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"peer_device\":\"">>, json_escape(PeerDevice), <<"\",">>,
        <<"\"peer_pubkey\":\"">>, json_escape(PeerPubkey), <<"\",">>,
        <<"\"local_pubkey\":\"">>, json_escape(LocalPubkey), <<"\",">>,
        <<"\"ceremony_kind\":\"">>, json_escape(CeremonyKind), <<"\",">>,
        <<"\"ceremony_id\":\"">>, json_escape(CeremonyId), <<"\",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\",">>,
        <<"\"established_at\":\"">>, json_escape(EstablishedAt), <<"\"}">>
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
            <<"vcalendar.phase_set">> ->
                <<"Phase set: ", (extract_json_string(Payload, <<"label">>))/binary>>;
            <<"calendar_block.added">> ->
                <<"Added ", (extract_json_string(Payload, <<"kind">>))/binary,
                  " block: ", (extract_json_string(Payload, <<"label">>))/binary>>;
            <<"calendar_block.moved">> ->
                <<"Moved ", (extract_json_string(Payload, <<"block_id">>))/binary>>;
            <<"checkup.scheduled">> ->
                <<"Scheduled ", (extract_json_string(Payload, <<"cadence">>))/binary,
                  " checkup on ", (extract_json_string(Payload, <<"lane_id">>))/binary>>;
            <<"checkup.completed">> ->
                <<"Completed checkup: ", (extract_json_string(Payload, <<"result">>))/binary>>;
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

extract_json_array(PayloadJson, Key) ->
    Payload = to_binary(PayloadJson),
    Pattern = iolist_to_binary([<<"\"">>, Key, <<"\":[">>]),
    case binary:split(Payload, Pattern) of
        [_Before, After] ->
            case binary:split(After, <<"]">>) of
                [ArrayBody, _Rest] -> iolist_to_binary([<<"[">>, ArrayBody, <<"]">>]);
                _ -> <<"[]">>
            end;
        _ ->
            <<"[]">>
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
