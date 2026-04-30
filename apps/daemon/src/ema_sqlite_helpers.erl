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
    persist_project_materialized/6,
    persist_project_archived/4,
    migrate_projects_unique_name/1,
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
    invite_projection_json/1,
    chronicle_activity_projection_json/1,
    project_filesystem_projection_json/1,
    space_vapps_projection_json/1,
    lane_registry_projection_json/1,
    lane_registry_projection_json_scoped/2,
    queue_registry_projection_json/1,
    queue_registry_projection_json_scoped/2,
    campaign_registry_projection_json/1,
    mission_registry_projection_json/1,
    handoff_registry_projection_json/1,
    problem_graph_projection_json/1,
    agent_reports_projection_json/1,
    blueprint_projection_json/1,
    blueprint_planner_projection_json/1,
    vcalendar_projection_json/1,
    intent_graph_projection_json/1,
    auto_checkup_due_lanes/1,
    peer_is_trusted/3,
    collab_open_document/5,
    collab_replace_document/5,
    collab_document_projection_json/2,
    event_exists/3,
    workspace_resource_exists/4
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
    LocalPath = extract_json_string(PayloadJson, <<"local_path">>),
    Sql = <<"INSERT OR REPLACE INTO projects
             (id, space_id, org_id, name, local_path, materialization_status, materialization_reason, created_at, created_by)
             VALUES (?1, ?2, ?3, ?4, ?5, 'pending', '', ?6, ?7)">>,
    exec_bound(Db, Sql, [ProjectId, SpaceId, OrgId, Name, LocalPath, CreatedAt, Actor]).

persist_project_materialized(Db, _OrgId, ProjectId, PayloadJson, _UpdatedAt, _Actor) ->
    Status = extract_json_string(PayloadJson, <<"status">>),
    LocalPath = extract_json_string(PayloadJson, <<"local_path">>),
    Reason = extract_json_string(PayloadJson, <<"reason">>),
    Sql = <<"UPDATE projects
             SET local_path = ?2, materialization_status = ?3, materialization_reason = ?4
             WHERE id = ?1">>,
    exec_bound(Db, Sql, [ProjectId, LocalPath, Status, Reason]).

persist_project_archived(Db, ProjectId, PayloadJson, UpdatedAt) ->
    SupersededBy =
        case extract_json_string(PayloadJson, <<"superseded_by">>) of
            <<>> -> <<"none">>;
            V -> V
        end,
    Reason =
        case extract_json_string(PayloadJson, <<"reason">>) of
            <<>> -> <<"archived">>;
            R -> R
        end,
    Suffix = iolist_to_binary([
        <<" (archived ">>, UpdatedAt, <<", dup of ">>, SupersededBy, <<") [">>,
        ProjectId, <<"]">>
    ]),
    Sql = <<"UPDATE projects
             SET name = name || ?2,
                 materialization_status = 'archived',
                 materialization_reason = ?3
             WHERE id = ?1
               AND materialization_status <> 'archived'">>,
    exec_bound(Db, Sql, [ProjectId, Suffix, Reason]).

migrate_projects_unique_name(Db) ->
    case esqlite3:q(Db, <<"PRAGMA user_version;">>) of
        {ok, [{Version}]} when Version >= 1 -> {ok, nil};
        _ ->
            case esqlite3:exec(Db,
                <<"BEGIN;",
                  "CREATE TABLE IF NOT EXISTS projects_new ("
                  " id TEXT PRIMARY KEY,"
                  " space_id TEXT NOT NULL,"
                  " org_id TEXT NOT NULL,"
                  " name TEXT NOT NULL,"
                  " local_path TEXT,"
                  " materialization_status TEXT,"
                  " materialization_reason TEXT,"
                  " created_at TEXT NOT NULL,"
                  " created_by TEXT NOT NULL,"
                  " UNIQUE(space_id, name));",
                  "INSERT INTO projects_new"
                  " (id, space_id, org_id, name, created_at, created_by,"
                  "  local_path, materialization_status, materialization_reason)"
                  " SELECT id, space_id, org_id, name, created_at, created_by,"
                  "        local_path, materialization_status, materialization_reason"
                  " FROM projects;",
                  "DROP TABLE projects;",
                  "ALTER TABLE projects_new RENAME TO projects;",
                  "PRAGMA user_version = 1;",
                  "COMMIT;">>) of
                ok -> {ok, nil};
                {error, _} = E -> E;
                Other -> {ok, Other}
            end
    end.

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

invite_projection_json(Db) ->
    Invites = select_invites(Db),
    InviteArray = join_json([invite_json(Id, OrgId, TargetKind, TargetValue, Role, Status, ExpiresAt, UpdatedAt) || {Id, OrgId, TargetKind, TargetValue, Role, Status, ExpiresAt, UpdatedAt} <- Invites]),
    iolist_to_binary([<<"{\"invites\":[">>, InviteArray, <<"]}">>]).

chronicle_activity_projection_json(Db) ->
    Events = select_chronicle_events(Db),
    Sessions = chronicle_sessions(Events),
    SourceStats = chronicle_source_stats(Events),
    EventArray = join_json([chronicle_event_json(Event) || Event <- Events]),
    SessionArray = join_json([chronicle_session_json(Session) || Session <- Sessions]),
    SourceArray = join_json([chronicle_source_json(Source) || Source <- SourceStats]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"host_id\":\"local\",">>,
        <<"\"events\":[">>, EventArray, <<"],">>,
        <<"\"sessions\":[">>, SessionArray, <<"],">>,
        <<"\"sources\":[">>, SourceArray, <<"]}">>
    ]).

project_filesystem_projection_json(Db) ->
    Projects = select_project_filesystems(Db),
    ProjectArray = join_json([project_filesystem_json(Id, SpaceId, OrgId, Name, LocalPath, Status, Reason) || {Id, SpaceId, OrgId, Name, LocalPath, Status, Reason} <- Projects]),
    iolist_to_binary([<<"{\"projects\":[">>, ProjectArray, <<"]}">>]).

space_vapps_projection_json(_Db) ->
    Apps = [
        vapp_json(<<"vapp-install-launchpad">>, <<"launchpad">>, <<"Launchpad">>, <<"projection">>, <<"EMA">>, true, 10),
        vapp_json(<<"vapp-install-braindump">>, <<"braindump">>, <<"Brain Dump">>, <<"staged">>, <<"EMA">>, true, 20),
        vapp_json(<<"vapp-install-hq">>, <<"hq">>, <<"HQ">>, <<"projection">>, <<"EMA">>, true, 30),
        vapp_json(<<"vapp-install-blueprint">>, <<"blueprint">>, <<"Blueprint">>, <<"projection">>, <<"EMA">>, true, 40),
        vapp_json(<<"vapp-install-git-ema">>, <<"git-ema">>, <<"git-ema">>, <<"live">>, <<"EMA">>, true, 50),
        vapp_json(<<"vapp-install-agent-work">>, <<"agent-work">>, <<"Agent Workspace">>, <<"projection">>, <<"agent-workspace-vapp">>, true, 60),
        vapp_json(<<"vapp-install-chronicle">>, <<"chronicle">>, <<"Chronicle">>, <<"projection">>, <<"EMA">>, true, 70),
        vapp_json(<<"vapp-install-wiki">>, <<"wiki">>, <<"Wiki / Doctrine">>, <<"staged">>, <<"atlas-vapp">>, true, 80),
        vapp_json(<<"vapp-install-threads">>, <<"threads">>, <<"Chat / Threads">>, <<"staged">>, <<"threads-vapp">>, true, 90),
        vapp_json(<<"vapp-install-settings">>, <<"settings">>, <<"Settings">>, <<"live">>, <<"EMA">>, true, 100)
    ],
    iolist_to_binary([
        <<"{\"org_id\":\"org:01J00000000000000000000001\",">>,
        <<"\"space_id\":\"space:01J00000000000000000000005\",">>,
        <<"\"source\":\"daemon_static_catalog\",">>,
        <<"\"apps\":[">>, join_json(Apps), <<"]}">>
    ]).

lane_registry_projection_json(Db) ->
    Events = select_events_like(Db, <<"lane.%">>, 500),
    LaneMap = lists:foldl(fun apply_lane_event/2, #{}, Events),
    Lanes = sort_by_updated(maps:values(LaneMap)),
    LaneArray = join_json([lane_registry_json(Lane) || Lane <- Lanes]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"lanes\":[">>, LaneArray, <<"]}">>
    ]).

lane_registry_projection_json_scoped(Db, ProjectId) ->
    Events = select_events_like(Db, <<"lane.%">>, 500),
    LaneMap = lists:foldl(fun apply_lane_event/2, #{}, Events),
    Lanes = filter_records_by_project(sort_by_updated(maps:values(LaneMap)), ProjectId),
    LaneArray = join_json([lane_registry_json(Lane) || Lane <- Lanes]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"scope_filter\":\"">>, json_escape(ProjectId), <<"\",">>,
        <<"\"lanes\":[">>, LaneArray, <<"]}">>
    ]).

queue_registry_projection_json(Db) ->
    Events = select_events_like(Db, <<"queue_item.%">>, 500),
    QueueMap = lists:foldl(fun apply_queue_event/2, #{}, Events),
    Items = sort_by_updated(maps:values(QueueMap)),
    ItemArray = join_json([queue_registry_json(Item) || Item <- Items]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"queue_items\":[">>, ItemArray, <<"]}">>
    ]).

queue_registry_projection_json_scoped(Db, ProjectId) ->
    Events = select_events_like(Db, <<"queue_item.%">>, 500),
    QueueMap = lists:foldl(fun apply_queue_event/2, #{}, Events),
    Items = filter_records_by_project(sort_by_updated(maps:values(QueueMap)), ProjectId),
    ItemArray = join_json([queue_registry_json(Item) || Item <- Items]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"scope_filter\":\"">>, json_escape(ProjectId), <<"\",">>,
        <<"\"queue_items\":[">>, ItemArray, <<"]}">>
    ]).

filter_records_by_project(Records, <<>>) -> Records;
filter_records_by_project(Records, ProjectId) ->
    lists:filter(
        fun(R) -> maps:get(project_id, R, <<>>) =:= ProjectId end,
        Records
    ).

campaign_registry_projection_json(Db) ->
    Events = select_events_like(Db, <<"campaign.%">>, 500),
    Map = lists:foldl(fun apply_campaign_event/2, #{}, Events),
    Items = sort_by_updated(maps:values(Map)),
    Array = join_json([workspace_record_json(campaign_id, Item) || Item <- Items]),
    iolist_to_binary([<<"{\"source\":\"daemon_events\",\"campaigns\":[">>, Array, <<"]}">>]).

mission_registry_projection_json(Db) ->
    Events = select_events_like(Db, <<"mission.%">>, 500),
    Map = lists:foldl(fun apply_mission_event/2, #{}, Events),
    Items = sort_by_updated(maps:values(Map)),
    Array = join_json([workspace_record_json(mission_id, Item) || Item <- Items]),
    iolist_to_binary([<<"{\"source\":\"daemon_events\",\"missions\":[">>, Array, <<"]}">>]).

handoff_registry_projection_json(Db) ->
    Events = select_events_like(Db, <<"handoff.%">>, 500),
    Map = lists:foldl(fun apply_handoff_event/2, #{}, Events),
    Items = sort_by_updated(maps:values(Map)),
    Array = join_json([workspace_record_json(handoff_id, Item) || Item <- Items]),
    iolist_to_binary([<<"{\"source\":\"daemon_events\",\"handoffs\":[">>, Array, <<"]}">>]).

problem_graph_projection_json(Db) ->
    Events = select_events_like(Db, <<"problem.%">>, 500),
    {Problems, Solutions, Links} = lists:foldl(fun apply_problem_event/2, {#{}, [], []}, Events),
    ProblemArray = join_json([workspace_record_json(problem_id, Item) || Item <- sort_by_updated(maps:values(Problems))]),
    SolutionArray = join_json([workspace_record_json(solution_id, Item) || Item <- lists:reverse(Solutions)]),
    LinkArray = join_json([workspace_link_json(Item) || Item <- lists:reverse(Links)]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",\"problems\":[">>, ProblemArray,
        <<"],\"solutions\":[">>, SolutionArray,
        <<"],\"links\":[">>, LinkArray, <<"]}">>
    ]).

agent_reports_projection_json(Db) ->
    Events = select_events_like(Db, <<"agent.%">>, 200),
    Reports = [agent_report_event_json(E) || E <- Events],
    Array = join_json(lists:reverse(Reports)),
    iolist_to_binary([<<"{\"source\":\"daemon_events\",\"reports\":[">>, Array, <<"]}">>]).

blueprint_projection_json(Db) ->
    Events = select_events_like(Db, <<"blueprint.%">>, 2000),
    {DocMap, SecMap} =
        lists:foldl(fun apply_blueprint_event/2, {#{}, #{}}, Events),
    Documents = maps:values(DocMap),
    Sections = maps:values(SecMap),
    DocumentArray = join_json([
        blueprint_document_json(Doc, Sections)
        || Doc <- sort_by_created(Documents),
           maps:get(status, Doc, <<"active">>) =/= <<"archived">>
    ]),
    SectionArray = join_json([
        blueprint_section_json(Sec)
        || Sec <- sort_sections_by_position(Sections),
           maps:get(removed, Sec, false) =:= false
    ]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"documents\":[">>, DocumentArray, <<"],">>,
        <<"\"sections\":[">>, SectionArray, <<"]}">>
    ]).

apply_blueprint_event({_Txid, Kind, Ts, Payload}, {Docs, Secs}) ->
    case Kind of
        <<"blueprint.document.created">> ->
            DocId = extract_json_string(Payload, <<"document_id">>),
            case DocId of
                <<>> -> {Docs, Secs};
                _ ->
                    Doc = blueprint_doc_default(DocId),
                    Updated = Doc#{
                        title => extract_json_string(Payload, <<"title">>),
                        project_id => extract_json_string(Payload, <<"project_id">>),
                        created_by => extract_json_string(Payload, <<"created_by">>),
                        status => <<"active">>,
                        created_at => Ts,
                        updated_at => Ts
                    },
                    {Docs#{DocId => Updated}, Secs}
            end;
        <<"blueprint.document.renamed">> ->
            DocId = extract_json_string(Payload, <<"document_id">>),
            ToTitle = extract_json_string(Payload, <<"to">>),
            case DocId of
                <<>> -> {Docs, Secs};
                _ ->
                    Current = maps:get(DocId, Docs, blueprint_doc_default(DocId)),
                    Updated = Current#{title => ToTitle, updated_at => Ts},
                    {Docs#{DocId => Updated}, Secs}
            end;
        <<"blueprint.document.archived">> ->
            DocId = extract_json_string(Payload, <<"document_id">>),
            case DocId of
                <<>> -> {Docs, Secs};
                _ ->
                    Current = maps:get(DocId, Docs, blueprint_doc_default(DocId)),
                    Updated = Current#{
                        status => <<"archived">>,
                        archived_reason => extract_json_string(Payload, <<"reason">>),
                        updated_at => Ts
                    },
                    {Docs#{DocId => Updated}, Secs}
            end;
        <<"blueprint.section.added">> ->
            SecId = extract_json_string(Payload, <<"section_id">>),
            case SecId of
                <<>> -> {Docs, Secs};
                _ ->
                    ParentId = non_empty(
                        extract_json_string(Payload, <<"parent_section_id">>),
                        extract_json_string(Payload, <<"parent_id">>)
                    ),
                    Sec = blueprint_section_default(SecId),
                    Updated = Sec#{
                        document_id => extract_json_string(Payload, <<"document_id">>),
                        parent_section_id => ParentId,
                        title => extract_json_string(Payload, <<"title">>),
                        position => extract_json_int(Payload, <<"position">>),
                        added_by => extract_json_string(Payload, <<"added_by">>),
                        status => <<"draft">>,
                        added_at => Ts,
                        updated_at => Ts,
                        removed => false
                    },
                    {Docs, Secs#{SecId => Updated}}
            end;
        <<"blueprint.section.renamed">> ->
            SecId = extract_json_string(Payload, <<"section_id">>),
            ToTitle = extract_json_string(Payload, <<"to">>),
            case SecId of
                <<>> -> {Docs, Secs};
                _ ->
                    Current = maps:get(SecId, Secs, blueprint_section_default(SecId)),
                    Updated = Current#{title => ToTitle, updated_at => Ts},
                    {Docs, Secs#{SecId => Updated}}
            end;
        <<"blueprint.section.moved">> ->
            SecId = extract_json_string(Payload, <<"section_id">>),
            case SecId of
                <<>> -> {Docs, Secs};
                _ ->
                    Current = maps:get(SecId, Secs, blueprint_section_default(SecId)),
                    %% `to` is an object: {parent: <id|null>, position: <int>}.
                    %% Cheap parse: pull out the position substring after `"to":{`.
                    To = extract_json_object(Payload, <<"to">>),
                    NewParent = extract_json_string(To, <<"parent">>),
                    NewPos = extract_json_int(To, <<"position">>),
                    Updated = Current#{
                        parent_section_id => NewParent,
                        position => NewPos,
                        updated_at => Ts
                    },
                    {Docs, Secs#{SecId => Updated}}
            end;
        <<"blueprint.section.removed">> ->
            SecId = extract_json_string(Payload, <<"section_id">>),
            case SecId of
                <<>> -> {Docs, Secs};
                _ ->
                    Current = maps:get(SecId, Secs, blueprint_section_default(SecId)),
                    Updated = Current#{
                        removed => true,
                        removed_by => extract_json_string(Payload, <<"removed_by">>),
                        updated_at => Ts
                    },
                    {Docs, Secs#{SecId => Updated}}
            end;
        _ ->
            {Docs, Secs}
    end.

blueprint_doc_default(DocId) ->
    #{
        id => DocId,
        title => <<>>,
        project_id => <<>>,
        created_by => <<>>,
        status => <<"active">>,
        archived_reason => <<>>,
        created_at => <<>>,
        updated_at => <<>>
    }.

blueprint_section_default(SecId) ->
    #{
        id => SecId,
        document_id => <<>>,
        parent_section_id => <<>>,
        title => <<>>,
        position => 0,
        status => <<"draft">>,
        added_by => <<>>,
        removed => false,
        removed_by => <<>>,
        added_at => <<>>,
        updated_at => <<>>
    }.

extract_json_object(PayloadJson, Key) ->
    Payload = to_binary(PayloadJson),
    Pattern = iolist_to_binary([<<"\"">>, Key, <<"\":{">>]),
    case binary:split(Payload, Pattern) of
        [_Before, After] ->
            case binary:split(After, <<"}">>) of
                [Body, _Rest] -> iolist_to_binary([<<"{">>, Body, <<"}">>]);
                _ -> <<"{}">>
            end;
        _ -> <<"{}">>
    end.

extract_json_int(PayloadJson, Key) ->
    Payload = to_binary(PayloadJson),
    Pattern = iolist_to_binary([<<"\"">>, Key, <<"\":">>]),
    case binary:split(Payload, Pattern) of
        [_Before, After] ->
            Raw = hd(binary:split(After, [<<",">>, <<"}">>], [global])),
            to_integer(Raw);
        _ ->
            0
    end.

sort_by_created(Items) ->
    lists:sort(
        fun(A, B) ->
            maps:get(created_at, A, <<>>) =< maps:get(created_at, B, <<>>)
        end,
        Items
    ).

blueprint_document_json(Doc, AllSections) ->
    DocId = maps:get(id, Doc),
    DocSections = [
        S
        || S <- AllSections,
           maps:get(document_id, S, <<>>) =:= DocId,
           maps:get(removed, S, false) =:= false
    ],
    Sorted = sort_sections_by_position(DocSections),
    SectionArray = join_json([blueprint_section_json(S) || S <- Sorted]),
    [
        <<"{\"id\":\"">>, json_escape(DocId), <<"\",">>,
        <<"\"document_id\":\"">>, json_escape(DocId), <<"\",">>,
        <<"\"title\":\"">>, json_escape(maps:get(title, Doc)), <<"\",">>,
        <<"\"project_id\":">>, nullable_string_json(maps:get(project_id, Doc)), <<",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, Doc)), <<"\",">>,
        <<"\"created_by\":">>, nullable_string_json(maps:get(created_by, Doc)), <<",">>,
        <<"\"created_at\":">>, nullable_string_json(maps:get(created_at, Doc)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, Doc)), <<",">>,
        <<"\"sections\":[">>, SectionArray, <<"]}">>
    ].

sort_sections_by_position(Sections) ->
    lists:sort(
        fun(A, B) ->
            PA = maps:get(position, A, 0),
            PB = maps:get(position, B, 0),
            case PA =:= PB of
                true ->
                    maps:get(added_at, A, <<>>) =< maps:get(added_at, B, <<>>);
                false ->
                    PA < PB
            end
        end,
        Sections
    ).

blueprint_section_json(Section) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, Section)), <<"\",">>,
        <<"\"section_id\":\"">>, json_escape(maps:get(id, Section)), <<"\",">>,
        <<"\"document_id\":\"">>, json_escape(maps:get(document_id, Section)), <<"\",">>,
        <<"\"parent_section_id\":">>, nullable_string_json(maps:get(parent_section_id, Section)), <<",">>,
        <<"\"title\":\"">>, json_escape(maps:get(title, Section)), <<"\",">>,
        <<"\"position\":">>, integer_to_binary(maps:get(position, Section, 0)), <<",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, Section)), <<"\",">>,
        <<"\"added_by\":">>, nullable_string_json(maps:get(added_by, Section)), <<",">>,
        <<"\"added_at\":">>, nullable_string_json(maps:get(added_at, Section)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, Section)), <<"}">>
    ].

%% --------------------------------------------------------------------
%% Planner-graph projection: GAC cards + blockers + aspirations + decisions.
%% Replays `blueprint.gac.*`, `blueprint.blocker.*`, `blueprint.aspiration.*`,
%% and `blueprint.decision.*` events into four parallel maps and renders a
%% single JSON object with one array per node family.
%% --------------------------------------------------------------------

blueprint_planner_projection_json(Db) ->
    GacEvents = select_events_like(Db, <<"blueprint.gac.%">>, 2000),
    BlockerEvents = select_events_like(Db, <<"blueprint.blocker.%">>, 2000),
    AspirationEvents = select_events_like(Db, <<"blueprint.aspiration.%">>, 2000),
    DecisionEvents = select_events_like(Db, <<"blueprint.decision.%">>, 2000),
    GacMap = lists:foldl(fun apply_gac_event/2, #{}, GacEvents),
    BlockerMap = lists:foldl(fun apply_blocker_event/2, #{}, BlockerEvents),
    AspirationMap = lists:foldl(fun apply_aspiration_event/2, #{}, AspirationEvents),
    DecisionMap = lists:foldl(fun apply_decision_event/2, #{}, DecisionEvents),
    GacArr = join_json([gac_json(G) || G <- sort_by_created(maps:values(GacMap))]),
    BlockerArr = join_json([blocker_json(B) || B <- sort_by_created(maps:values(BlockerMap))]),
    AspirationArr = join_json([aspiration_json(A) || A <- sort_by_created(maps:values(AspirationMap))]),
    DecisionArr = join_json([decision_json(D) || D <- sort_by_created(maps:values(DecisionMap))]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"gac_cards\":[">>, GacArr, <<"],">>,
        <<"\"blockers\":[">>, BlockerArr, <<"],">>,
        <<"\"aspirations\":[">>, AspirationArr, <<"],">>,
        <<"\"decisions\":[">>, DecisionArr, <<"]}">>
    ]).

apply_gac_event({_Txid, Kind, Ts, Payload}, Acc) ->
    GacId = extract_json_string(Payload, <<"gac_id">>),
    case GacId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(GacId, Acc, gac_default(GacId)),
            Next = case Kind of
                <<"blueprint.gac.created">> ->
                    Current#{
                        document_id => extract_json_string(Payload, <<"document_id">>),
                        section_id => extract_json_string(Payload, <<"section_id">>),
                        category => extract_json_string(Payload, <<"category">>),
                        priority => extract_json_string(Payload, <<"priority">>),
                        question => extract_json_string(Payload, <<"question">>),
                        by => extract_json_string(Payload, <<"by">>),
                        status => <<"pending">>,
                        created_at => Ts,
                        updated_at => Ts
                    };
                <<"blueprint.gac.answered">> ->
                    Current#{
                        status => <<"answered">>,
                        selected => extract_json_string(Payload, <<"selected">>),
                        freeform => extract_json_string(Payload, <<"freeform">>),
                        result_action => extract_json_string(Payload, <<"result_action">>),
                        target => extract_json_string(Payload, <<"target">>),
                        updated_at => Ts
                    };
                <<"blueprint.gac.deferred">> ->
                    Current#{
                        status => <<"deferred">>,
                        defer_to => extract_json_string(Payload, <<"defer_to">>),
                        defer_reason => extract_json_string(Payload, <<"reason">>),
                        updated_at => Ts
                    };
                <<"blueprint.gac.promoted">> ->
                    Current#{
                        status => <<"promoted">>,
                        promoted_kind => extract_json_string(Payload, <<"promoted_kind">>),
                        target => extract_json_string(Payload, <<"target">>),
                        updated_at => Ts
                    };
                _ -> Current#{updated_at => Ts}
            end,
            Acc#{GacId => Next}
    end.

apply_blocker_event({_Txid, Kind, Ts, Payload}, Acc) ->
    BlockerId = extract_json_string(Payload, <<"blocker_id">>),
    case BlockerId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(BlockerId, Acc, blocker_default(BlockerId)),
            Next = case Kind of
                <<"blueprint.blocker.opened">> ->
                    Current#{
                        document_id => extract_json_string(Payload, <<"document_id">>),
                        section_id => extract_json_string(Payload, <<"section_id">>),
                        category => extract_json_string(Payload, <<"category">>),
                        priority => extract_json_string(Payload, <<"priority">>),
                        title => extract_json_string(Payload, <<"title">>),
                        description => extract_json_string(Payload, <<"description">>),
                        resolve_by => extract_json_string(Payload, <<"resolve_by">>),
                        promoted_from => extract_json_string(Payload, <<"promoted_from">>),
                        by => extract_json_string(Payload, <<"by">>),
                        status => <<"open">>,
                        created_at => Ts,
                        updated_at => Ts
                    };
                <<"blueprint.blocker.resolved">> ->
                    Current#{
                        status => <<"resolved">>,
                        resolved_to => extract_json_string(Payload, <<"resolved_to">>),
                        resolved_note => extract_json_string(Payload, <<"note">>),
                        updated_at => Ts
                    };
                <<"blueprint.blocker.promoted">> ->
                    Current#{
                        status => <<"promoted">>,
                        target => extract_json_string(Payload, <<"target">>),
                        updated_at => Ts
                    };
                _ -> Current#{updated_at => Ts}
            end,
            Acc#{BlockerId => Next}
    end.

apply_aspiration_event({_Txid, Kind, Ts, Payload}, Acc) ->
    AspId = extract_json_string(Payload, <<"aspiration_id">>),
    case AspId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(AspId, Acc, aspiration_default(AspId)),
            Next = case Kind of
                <<"blueprint.aspiration.captured">> ->
                    SourceObj = extract_json_object(Payload, <<"source">>),
                    Current#{
                        title => extract_json_string(Payload, <<"title">>),
                        description => extract_json_string(Payload, <<"description">>),
                        timeframe => extract_json_string(Payload, <<"timeframe">>),
                        source_type => extract_json_string(SourceObj, <<"type">>),
                        origin_app => extract_json_string(SourceObj, <<"origin_app">>),
                        origin_text => extract_json_string(SourceObj, <<"origin_text">>),
                        by => extract_json_string(Payload, <<"by">>),
                        status => <<"captured">>,
                        created_at => Ts,
                        updated_at => Ts
                    };
                <<"blueprint.aspiration.promoted">> ->
                    Current#{
                        status => <<"promoted">>,
                        target => extract_json_string(Payload, <<"target">>),
                        updated_at => Ts
                    };
                <<"blueprint.aspiration.archived">> ->
                    Current#{
                        status => <<"archived">>,
                        archived_reason => extract_json_string(Payload, <<"reason">>),
                        updated_at => Ts
                    };
                _ -> Current#{updated_at => Ts}
            end,
            Acc#{AspId => Next}
    end.

apply_decision_event({_Txid, Kind, Ts, Payload}, Acc) ->
    DecId = extract_json_string(Payload, <<"decision_id">>),
    case DecId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(DecId, Acc, decision_default(DecId)),
            Next = case Kind of
                <<"blueprint.decision.locked">> ->
                    Current#{
                        title => extract_json_string(Payload, <<"title">>),
                        body => extract_json_string(Payload, <<"body">>),
                        supersedes => extract_json_string(Payload, <<"supersedes">>),
                        source_node => extract_json_string(Payload, <<"source_node">>),
                        by => extract_json_string(Payload, <<"by">>),
                        status => <<"committed">>,
                        created_at => Ts,
                        updated_at => Ts
                    };
                <<"blueprint.decision.superseded">> ->
                    Current#{
                        status => <<"superseded">>,
                        superseded_by => extract_json_string(Payload, <<"superseded_by">>),
                        superseded_reason => extract_json_string(Payload, <<"reason">>),
                        updated_at => Ts
                    };
                _ -> Current#{updated_at => Ts}
            end,
            Acc#{DecId => Next}
    end.

gac_default(GacId) ->
    #{
        id => GacId, document_id => <<>>, section_id => <<>>,
        category => <<>>, priority => <<>>, question => <<>>,
        by => <<>>, status => <<"pending">>,
        selected => <<>>, freeform => <<>>, result_action => <<>>, target => <<>>,
        defer_to => <<>>, defer_reason => <<>>, promoted_kind => <<>>,
        created_at => <<>>, updated_at => <<>>
    }.

blocker_default(BlockerId) ->
    #{
        id => BlockerId, document_id => <<>>, section_id => <<>>,
        category => <<>>, priority => <<>>, title => <<>>,
        description => <<>>, resolve_by => <<>>, promoted_from => <<>>,
        by => <<>>, status => <<"open">>,
        resolved_to => <<>>, resolved_note => <<>>, target => <<>>,
        created_at => <<>>, updated_at => <<>>
    }.

aspiration_default(AspId) ->
    #{
        id => AspId, title => <<>>, description => <<>>,
        timeframe => <<>>, source_type => <<>>, origin_app => <<>>, origin_text => <<>>,
        by => <<>>, status => <<"captured">>,
        target => <<>>, archived_reason => <<>>,
        created_at => <<>>, updated_at => <<>>
    }.

decision_default(DecId) ->
    #{
        id => DecId, title => <<>>, body => <<>>,
        supersedes => <<>>, source_node => <<>>,
        by => <<>>, status => <<"committed">>,
        superseded_by => <<>>, superseded_reason => <<>>,
        created_at => <<>>, updated_at => <<>>
    }.

gac_json(G) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, G)), <<"\",">>,
        <<"\"gac_id\":\"">>, json_escape(maps:get(id, G)), <<"\",">>,
        <<"\"document_id\":">>, nullable_string_json(maps:get(document_id, G)), <<",">>,
        <<"\"section_id\":">>, nullable_string_json(maps:get(section_id, G)), <<",">>,
        <<"\"category\":">>, nullable_string_json(maps:get(category, G)), <<",">>,
        <<"\"priority\":">>, nullable_string_json(maps:get(priority, G)), <<",">>,
        <<"\"question\":">>, nullable_string_json(maps:get(question, G)), <<",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, G)), <<"\",">>,
        <<"\"selected\":">>, nullable_string_json(maps:get(selected, G)), <<",">>,
        <<"\"freeform\":">>, nullable_string_json(maps:get(freeform, G)), <<",">>,
        <<"\"result_action\":">>, nullable_string_json(maps:get(result_action, G)), <<",">>,
        <<"\"target\":">>, nullable_string_json(maps:get(target, G)), <<",">>,
        <<"\"defer_to\":">>, nullable_string_json(maps:get(defer_to, G)), <<",">>,
        <<"\"by\":">>, nullable_string_json(maps:get(by, G)), <<",">>,
        <<"\"created_at\":">>, nullable_string_json(maps:get(created_at, G)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, G)), <<"}">>
    ].

blocker_json(B) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, B)), <<"\",">>,
        <<"\"blocker_id\":\"">>, json_escape(maps:get(id, B)), <<"\",">>,
        <<"\"document_id\":">>, nullable_string_json(maps:get(document_id, B)), <<",">>,
        <<"\"section_id\":">>, nullable_string_json(maps:get(section_id, B)), <<",">>,
        <<"\"category\":">>, nullable_string_json(maps:get(category, B)), <<",">>,
        <<"\"priority\":">>, nullable_string_json(maps:get(priority, B)), <<",">>,
        <<"\"title\":">>, nullable_string_json(maps:get(title, B)), <<",">>,
        <<"\"description\":">>, nullable_string_json(maps:get(description, B)), <<",">>,
        <<"\"resolve_by\":">>, nullable_string_json(maps:get(resolve_by, B)), <<",">>,
        <<"\"promoted_from\":">>, nullable_string_json(maps:get(promoted_from, B)), <<",">>,
        <<"\"resolved_to\":">>, nullable_string_json(maps:get(resolved_to, B)), <<",">>,
        <<"\"target\":">>, nullable_string_json(maps:get(target, B)), <<",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, B)), <<"\",">>,
        <<"\"by\":">>, nullable_string_json(maps:get(by, B)), <<",">>,
        <<"\"created_at\":">>, nullable_string_json(maps:get(created_at, B)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, B)), <<"}">>
    ].

aspiration_json(A) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, A)), <<"\",">>,
        <<"\"aspiration_id\":\"">>, json_escape(maps:get(id, A)), <<"\",">>,
        <<"\"title\":">>, nullable_string_json(maps:get(title, A)), <<",">>,
        <<"\"description\":">>, nullable_string_json(maps:get(description, A)), <<",">>,
        <<"\"timeframe\":">>, nullable_string_json(maps:get(timeframe, A)), <<",">>,
        <<"\"source_type\":">>, nullable_string_json(maps:get(source_type, A)), <<",">>,
        <<"\"origin_app\":">>, nullable_string_json(maps:get(origin_app, A)), <<",">>,
        <<"\"origin_text\":">>, nullable_string_json(maps:get(origin_text, A)), <<",">>,
        <<"\"target\":">>, nullable_string_json(maps:get(target, A)), <<",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, A)), <<"\",">>,
        <<"\"by\":">>, nullable_string_json(maps:get(by, A)), <<",">>,
        <<"\"created_at\":">>, nullable_string_json(maps:get(created_at, A)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, A)), <<"}">>
    ].

decision_json(D) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, D)), <<"\",">>,
        <<"\"decision_id\":\"">>, json_escape(maps:get(id, D)), <<"\",">>,
        <<"\"title\":">>, nullable_string_json(maps:get(title, D)), <<",">>,
        <<"\"body\":">>, nullable_string_json(maps:get(body, D)), <<",">>,
        <<"\"supersedes\":">>, nullable_string_json(maps:get(supersedes, D)), <<",">>,
        <<"\"superseded_by\":">>, nullable_string_json(maps:get(superseded_by, D)), <<",">>,
        <<"\"source_node\":">>, nullable_string_json(maps:get(source_node, D)), <<",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, D)), <<"\",">>,
        <<"\"by\":">>, nullable_string_json(maps:get(by, D)), <<",">>,
        <<"\"created_at\":">>, nullable_string_json(maps:get(created_at, D)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, D)), <<"}">>
    ].

%% --------------------------------------------------------------------
%% vcalendar projection: aggregates current canonical phase, calendar
%% blocks, and scheduled+completed checkups from the event log.
%% --------------------------------------------------------------------

vcalendar_projection_json(Db) ->
    PhaseEvents = select_events_like(Db, <<"vcalendar.%">>, 1000),
    BlockEvents = select_events_like(Db, <<"calendar_block.%">>, 1000),
    CheckupEvents = select_events_like(Db, <<"checkup.%">>, 1000),
    Phase = lists:foldl(fun apply_vcalendar_event/2,
                        #{label => <<>>, set_at => <<>>, set_by => <<>>},
                        PhaseEvents),
    BlockMap = lists:foldl(fun apply_calendar_block_event/2, #{}, BlockEvents),
    CheckupMap = lists:foldl(fun apply_checkup_event/2, #{}, CheckupEvents),
    Blocks = sort_by_start(maps:values(BlockMap)),
    Checkups = sort_by_scheduled(maps:values(CheckupMap)),
    BlocksArr = join_json([calendar_block_json(B) || B <- Blocks]),
    CheckupsArr = join_json([checkup_json(C) || C <- Checkups]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"current_phase\":">>, nullable_string_json(maps:get(label, Phase)), <<",">>,
        <<"\"current_phase_set_at\":">>, nullable_string_json(maps:get(set_at, Phase)), <<",">>,
        <<"\"current_phase_set_by\":">>, nullable_string_json(maps:get(set_by, Phase)), <<",">>,
        <<"\"blocks\":[">>, BlocksArr, <<"],">>,
        <<"\"checkups\":[">>, CheckupsArr, <<"]}">>
    ]).

apply_vcalendar_event({_Txid, Kind, Ts, Payload}, Acc) ->
    case Kind of
        <<"vcalendar.phase_set">> ->
            Acc#{
                label => extract_json_string(Payload, <<"label">>),
                set_at => Ts,
                set_by => extract_json_string(Payload, <<"actor_id">>)
            };
        _ -> Acc
    end.

apply_calendar_block_event({_Txid, Kind, Ts, Payload}, Acc) ->
    BlockId = extract_json_string(Payload, <<"block_id">>),
    case BlockId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(BlockId, Acc, calendar_block_default(BlockId)),
            Next = case Kind of
                <<"calendar_block.added">> ->
                    Current#{
                        kind => extract_json_string(Payload, <<"block_kind">>),
                        label => extract_json_string(Payload, <<"label">>),
                        start_at => extract_json_string(Payload, <<"start_at">>),
                        end_at => extract_json_string(Payload, <<"end_at">>),
                        actor_id => extract_json_string(Payload, <<"actor_id">>),
                        added_at => Ts,
                        updated_at => Ts
                    };
                <<"calendar_block.moved">> ->
                    Current#{
                        start_at => extract_json_string(Payload, <<"start_at">>),
                        end_at => extract_json_string(Payload, <<"end_at">>),
                        updated_at => Ts
                    };
                _ -> Current#{updated_at => Ts}
            end,
            Acc#{BlockId => Next}
    end.

apply_checkup_event({_Txid, Kind, Ts, Payload}, Acc) ->
    CheckupId = extract_json_string(Payload, <<"checkup_id">>),
    case CheckupId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(CheckupId, Acc, checkup_default(CheckupId)),
            Next = case Kind of
                <<"checkup.scheduled">> ->
                    Current#{
                        lane_id => extract_json_string(Payload, <<"lane_id">>),
                        cadence => extract_json_string(Payload, <<"cadence">>),
                        scheduled_by => extract_json_string(Payload, <<"scheduled_by">>),
                        status => <<"scheduled">>,
                        scheduled_at => Ts,
                        updated_at => Ts
                    };
                <<"checkup.completed">> ->
                    Current#{
                        status => <<"completed">>,
                        result => extract_json_string(Payload, <<"result">>),
                        completed_by => extract_json_string(Payload, <<"completed_by">>),
                        completed_at => Ts,
                        updated_at => Ts
                    };
                _ -> Current#{updated_at => Ts}
            end,
            Acc#{CheckupId => Next}
    end.

calendar_block_default(BlockId) ->
    #{
        id => BlockId, kind => <<>>, label => <<>>,
        start_at => <<>>, end_at => <<>>, actor_id => <<>>,
        added_at => <<>>, updated_at => <<>>
    }.

checkup_default(CheckupId) ->
    #{
        id => CheckupId, lane_id => <<>>, cadence => <<>>,
        scheduled_by => <<>>, completed_by => <<>>, result => <<>>,
        status => <<"scheduled">>, scheduled_at => <<>>, completed_at => <<>>,
        updated_at => <<>>
    }.

sort_by_start(Items) ->
    lists:sort(
        fun(A, B) ->
            maps:get(start_at, A, <<>>) =< maps:get(start_at, B, <<>>)
        end,
        Items
    ).

sort_by_scheduled(Items) ->
    lists:sort(
        fun(A, B) ->
            maps:get(scheduled_at, A, <<>>) =< maps:get(scheduled_at, B, <<>>)
        end,
        Items
    ).

calendar_block_json(B) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, B)), <<"\",">>,
        <<"\"block_id\":\"">>, json_escape(maps:get(id, B)), <<"\",">>,
        <<"\"kind\":">>, nullable_string_json(maps:get(kind, B)), <<",">>,
        <<"\"label\":">>, nullable_string_json(maps:get(label, B)), <<",">>,
        <<"\"start_at\":">>, nullable_string_json(maps:get(start_at, B)), <<",">>,
        <<"\"end_at\":">>, nullable_string_json(maps:get(end_at, B)), <<",">>,
        <<"\"actor_id\":">>, nullable_string_json(maps:get(actor_id, B)), <<",">>,
        <<"\"added_at\":">>, nullable_string_json(maps:get(added_at, B)), <<"}">>
    ].

checkup_json(C) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, C)), <<"\",">>,
        <<"\"checkup_id\":\"">>, json_escape(maps:get(id, C)), <<"\",">>,
        <<"\"lane_id\":">>, nullable_string_json(maps:get(lane_id, C)), <<",">>,
        <<"\"cadence\":">>, nullable_string_json(maps:get(cadence, C)), <<",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, C)), <<"\",">>,
        <<"\"scheduled_by\":">>, nullable_string_json(maps:get(scheduled_by, C)), <<",">>,
        <<"\"completed_by\":">>, nullable_string_json(maps:get(completed_by, C)), <<",">>,
        <<"\"result\":">>, nullable_string_json(maps:get(result, C)), <<",">>,
        <<"\"scheduled_at\":">>, nullable_string_json(maps:get(scheduled_at, C)), <<",">>,
        <<"\"completed_at\":">>, nullable_string_json(maps:get(completed_at, C)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, C)), <<"}">>
    ].

%% --------------------------------------------------------------------
%% Intent graph projection — joins workspace + blueprint + decisions.
%% Returns a single graph: nodes (section, GAC, blocker, aspiration,
%% decision, lane, queue_item) + edges derived from existing payload
%% fields (parent_section_id, supersedes, promoted_from, target,
%% blueprint_section_id/gac_id/decision_id cross-refs from ADR 08, etc).
%%
%% Output shape:
%%   {
%%     "source": "daemon_events",
%%     "nodes": [{"id":...,"kind":"section|gac|blocker|aspiration|decision|lane|queue_item","title":...,"status":...}, ...],
%%     "edges": [{"from":...,"to":...,"relation":"contains|references|promoted_from|supersedes|linked|aspiration_of|blocks", "via":"<event_kind>"}, ...]
%%   }
%% --------------------------------------------------------------------

intent_graph_projection_json(Db) ->
    BlueprintEvents = select_events_like(Db, <<"blueprint.%">>, 4000),
    LaneEvents = select_events_like(Db, <<"lane.%">>, 1000),
    QueueEvents = select_events_like(Db, <<"queue_item.%">>, 1000),
    {DocMap, SecMap} =
        lists:foldl(fun apply_blueprint_event/2, {#{}, #{}}, BlueprintEvents),
    GacMap = lists:foldl(fun apply_gac_event/2, #{},
                         [E || E <- BlueprintEvents,
                               binary:match(element(2, E), <<"blueprint.gac.">>) =/= nomatch]),
    BlockerMap = lists:foldl(fun apply_blocker_event/2, #{},
                             [E || E <- BlueprintEvents,
                                   binary:match(element(2, E), <<"blueprint.blocker.">>) =/= nomatch]),
    AspMap = lists:foldl(fun apply_aspiration_event/2, #{},
                         [E || E <- BlueprintEvents,
                               binary:match(element(2, E), <<"blueprint.aspiration.">>) =/= nomatch]),
    DecMap = lists:foldl(fun apply_decision_event/2, #{},
                         [E || E <- BlueprintEvents,
                               binary:match(element(2, E), <<"blueprint.decision.">>) =/= nomatch]),
    LaneMap = lists:foldl(fun apply_lane_event/2, #{}, LaneEvents),
    QueueMap = lists:foldl(fun apply_queue_event/2, #{}, QueueEvents),
    Sections = [S || S <- maps:values(SecMap),
                     maps:get(removed, S, false) =:= false],
    Documents = maps:values(DocMap),
    Nodes = build_intent_nodes(Sections, Documents,
                               maps:values(GacMap),
                               maps:values(BlockerMap),
                               maps:values(AspMap),
                               maps:values(DecMap),
                               maps:values(LaneMap),
                               maps:values(QueueMap)),
    Edges = build_intent_edges(Sections, Documents,
                               maps:values(GacMap),
                               maps:values(BlockerMap),
                               maps:values(AspMap),
                               maps:values(DecMap),
                               maps:values(LaneMap),
                               maps:values(QueueMap)),
    NodesArr = join_json([intent_node_json(N) || N <- Nodes]),
    EdgesArr = join_json([intent_edge_json(E) || E <- Edges]),
    iolist_to_binary([
        <<"{\"source\":\"daemon_events\",">>,
        <<"\"nodes\":[">>, NodesArr, <<"],">>,
        <<"\"edges\":[">>, EdgesArr, <<"]}">>
    ]).

build_intent_nodes(Sections, Documents, Gacs, Blockers, Aspirations, Decisions, Lanes, Queues) ->
    SecNodes = [#{id => maps:get(id, S), kind => <<"section">>,
                  title => maps:get(title, S, <<>>),
                  status => maps:get(status, S, <<>>)}
                || S <- Sections],
    DocNodes = [#{id => maps:get(id, D), kind => <<"document">>,
                  title => maps:get(title, D, <<>>),
                  status => maps:get(status, D, <<>>)}
                || D <- Documents,
                   maps:get(status, D, <<"active">>) =/= <<"archived">>],
    GacNodes = [#{id => maps:get(id, G), kind => <<"gac">>,
                  title => maps:get(question, G, <<>>),
                  status => maps:get(status, G, <<>>)}
                || G <- Gacs],
    BlockerNodes = [#{id => maps:get(id, B), kind => <<"blocker">>,
                      title => maps:get(title, B, <<>>),
                      status => maps:get(status, B, <<>>)}
                    || B <- Blockers],
    AspNodes = [#{id => maps:get(id, A), kind => <<"aspiration">>,
                  title => maps:get(title, A, <<>>),
                  status => maps:get(status, A, <<>>)}
                || A <- Aspirations],
    DecNodes = [#{id => maps:get(id, Dec), kind => <<"decision">>,
                  title => maps:get(title, Dec, <<>>),
                  status => maps:get(status, Dec, <<>>)}
                || Dec <- Decisions],
    LaneNodes = [#{id => maps:get(id, L), kind => <<"lane">>,
                   title => maps:get(title, L, <<>>),
                   status => maps:get(status, L, <<>>)}
                 || L <- Lanes],
    QueueNodes = [#{id => maps:get(id, Q), kind => <<"queue_item">>,
                    title => maps:get(title, Q, <<>>),
                    status => maps:get(status, Q, <<>>)}
                  || Q <- Queues],
    DocNodes ++ SecNodes ++ GacNodes ++ BlockerNodes ++ AspNodes
        ++ DecNodes ++ LaneNodes ++ QueueNodes.

build_intent_edges(Sections, _Documents, Gacs, Blockers, Aspirations, Decisions, Lanes, Queues) ->
    SectionDocEdges = [
        edge(maps:get(id, S), maps:get(document_id, S), <<"contains">>,
             <<"blueprint.section.added">>)
        || S <- Sections,
           maps:get(document_id, S, <<>>) =/= <<>>
    ],
    SectionParentEdges = [
        edge(maps:get(id, S), maps:get(parent_section_id, S), <<"contains">>,
             <<"blueprint.section.added">>)
        || S <- Sections,
           maps:get(parent_section_id, S, <<>>) =/= <<>>
    ],
    GacSectionEdges = [
        edge(maps:get(id, G), maps:get(section_id, G), <<"references">>,
             <<"blueprint.gac.created">>)
        || G <- Gacs,
           maps:get(section_id, G, <<>>) =/= <<>>
    ],
    GacAnswerEdges = [
        edge(maps:get(id, G), maps:get(target, G), <<"answered_into">>,
             <<"blueprint.gac.answered">>)
        || G <- Gacs,
           maps:get(target, G, <<>>) =/= <<>>,
           maps:get(status, G, <<>>) =:= <<"answered">>
    ],
    BlockerPromotedEdges = [
        edge(maps:get(promoted_from, B), maps:get(id, B), <<"promoted_from">>,
             <<"blueprint.blocker.opened">>)
        || B <- Blockers,
           maps:get(promoted_from, B, <<>>) =/= <<>>
    ],
    AspirationTargetEdges = [
        edge(maps:get(id, A), maps:get(target, A), <<"aspiration_of">>,
             <<"blueprint.aspiration.promoted">>)
        || A <- Aspirations,
           maps:get(target, A, <<>>) =/= <<>>
    ],
    DecisionSupersedesEdges = [
        edge(maps:get(id, Dec), maps:get(supersedes, Dec), <<"supersedes">>,
             <<"blueprint.decision.locked">>)
        || Dec <- Decisions,
           maps:get(supersedes, Dec, <<>>) =/= <<>>
    ],
    LaneXrefEdges = lists:flatten([
        lane_blueprint_edges(L) || L <- Lanes
    ]),
    QueueXrefEdges = lists:flatten([
        queue_blueprint_edges(Q) || Q <- Queues
    ]),
    QueueLaneEdges = [
        edge(maps:get(id, Q), maps:get(lane_id, Q), <<"queued_in">>,
             <<"queue_item.added">>)
        || Q <- Queues,
           maps:get(lane_id, Q, <<>>) =/= <<>>
    ],
    SectionDocEdges ++ SectionParentEdges ++ GacSectionEdges ++ GacAnswerEdges
        ++ BlockerPromotedEdges ++ AspirationTargetEdges ++ DecisionSupersedesEdges
        ++ LaneXrefEdges ++ QueueXrefEdges ++ QueueLaneEdges.

lane_blueprint_edges(Lane) ->
    LaneId = maps:get(id, Lane),
    Section = maps:get(blueprint_section_id, Lane, <<>>),
    Gac = maps:get(blueprint_gac_id, Lane, <<>>),
    Decision = maps:get(blueprint_decision_id, Lane, <<>>),
    [edge(LaneId, T, <<"linked">>, <<"lane.opened">>)
     || T <- [Section, Gac, Decision], T =/= <<>>].

queue_blueprint_edges(Item) ->
    ItemId = maps:get(id, Item),
    Section = maps:get(blueprint_section_id, Item, <<>>),
    Gac = maps:get(blueprint_gac_id, Item, <<>>),
    Decision = maps:get(blueprint_decision_id, Item, <<>>),
    [edge(ItemId, T, <<"linked">>, <<"queue_item.added">>)
     || T <- [Section, Gac, Decision], T =/= <<>>].

edge(From, To, Relation, Via) ->
    #{from => From, to => To, relation => Relation, via => Via}.

intent_node_json(N) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, N)), <<"\",">>,
        <<"\"kind\":\"">>, json_escape(maps:get(kind, N)), <<"\",">>,
        <<"\"title\":">>, nullable_string_json(maps:get(title, N, <<>>)), <<",">>,
        <<"\"status\":">>, nullable_string_json(maps:get(status, N, <<>>)), <<"}">>
    ].

intent_edge_json(E) ->
    [
        <<"{\"from\":\"">>, json_escape(maps:get(from, E)), <<"\",">>,
        <<"\"to\":\"">>, json_escape(maps:get(to, E)), <<"\",">>,
        <<"\"relation\":\"">>, json_escape(maps:get(relation, E)), <<"\",">>,
        <<"\"via\":\"">>, json_escape(maps:get(via, E)), <<"\"}">>
    ].

%% --------------------------------------------------------------------
%% Auto-checkup scan: returns the list of active/claimed lanes whose
%% most-recent `checkup.scheduled` event is older than the lane's
%% cadence threshold.
%%
%% Threshold matrix (from ADR 13):
%%   daily       => 86_400s
%%   weekly      => 604_800s
%%   per_handoff => infinite (never auto-emit)
%%   "" / unset  => default to daily (86_400s)
%%
%% Returns a list of {OrgId, SpaceId, ProjectId, LaneId, Cadence}
%% 5-tuples (binaries). The OrgId comes from the lane.opened envelope
%% (caller's resolved org); SpaceId is whatever the writer set
%% (currently empty until L1 lands envelope-scope plumbing); ProjectId
%% comes from the lane.opened payload. Gleam side iterates and calls
%% ema_vcalendar:schedule_checkup/5 with each lane's actual scope —
%% no more hard-coded org.
%% --------------------------------------------------------------------

auto_checkup_due_lanes(Db) ->
    LaneEvents = select_events_like_with_scope(Db, <<"lane.%">>, 1000),
    LaneMap = lists:foldl(fun apply_lane_event_with_scope/2, #{}, LaneEvents),
    CheckupEvents = select_events_like(Db, <<"checkup.%">>, 2000),
    LastByLane = lists:foldl(fun fold_last_checkup/2, #{}, CheckupEvents),
    NowSeconds = erlang:system_time(second),
    DueLanes = lists:foldl(
        fun(Lane, Acc) ->
            case lane_due_for_checkup(Lane, LastByLane, NowSeconds) of
                {true, Cadence} ->
                    [{
                        maps:get(env_org_id, Lane, <<>>),
                        maps:get(env_space_id, Lane, <<>>),
                        maps:get(project_id, Lane, <<>>),
                        maps:get(id, Lane),
                        Cadence
                    } | Acc];
                false -> Acc
            end
        end,
        [],
        maps:values(LaneMap)
    ),
    lists:reverse(DueLanes).

%% Wrapper around apply_lane_event/2 that also captures the
%% envelope-level scope (org_id / space_id) on lane.opened so the
%% auto-checkup tick can emit each checkup with the correct
%% per-lane org/space. The payload's project_id is already captured
%% by apply_lane_event/2 itself.
apply_lane_event_with_scope({Txid, Kind, Ts, OrgId, SpaceId, _ProjectIdEnvelope, Payload}, Acc) ->
    Acc1 = apply_lane_event({Txid, Kind, Ts, Payload}, Acc),
    %% Only stamp the envelope scope on the initial open event; later
    %% events on the same lane should not move the lane between orgs.
    case Kind of
        <<"lane.opened">> ->
            LaneId = extract_json_string(Payload, <<"lane_id">>),
            case LaneId of
                <<>> -> Acc1;
                _ ->
                    Lane = maps:get(LaneId, Acc1, lane_default(LaneId)),
                    Acc1#{LaneId => Lane#{
                        env_org_id => OrgId,
                        env_space_id => SpaceId
                    }}
            end;
        _ -> Acc1
    end.

fold_last_checkup({_Txid, Kind, Ts, Payload}, Acc) ->
    case Kind of
        <<"checkup.scheduled">> ->
            LaneId = extract_json_string(Payload, <<"lane_id">>),
            case LaneId of
                <<>> -> Acc;
                _ ->
                    Existing = maps:get(LaneId, Acc, <<>>),
                    case Ts > Existing of
                        true -> Acc#{LaneId => Ts};
                        false -> Acc
                    end
            end;
        _ -> Acc
    end.

lane_due_for_checkup(Lane, LastByLane, NowSeconds) ->
    Status = maps:get(status, Lane, <<>>),
    case Status of
        <<"active">> -> due_check(Lane, LastByLane, NowSeconds);
        <<"claimed">> -> due_check(Lane, LastByLane, NowSeconds);
        _ -> false
    end.

due_check(Lane, LastByLane, NowSeconds) ->
    LaneId = maps:get(id, Lane),
    Cadence0 = maps:get(lane_cadence, Lane, <<>>),
    Cadence = case Cadence0 of <<>> -> <<"daily">>; _ -> Cadence0 end,
    case threshold_seconds(Cadence) of
        infinity -> false;
        Threshold ->
            LastTs = maps:get(LaneId, LastByLane, <<>>),
            case iso_to_seconds(LastTs) of
                none -> {true, Cadence};
                {ok, LastSeconds} ->
                    case NowSeconds - LastSeconds > Threshold of
                        true -> {true, Cadence};
                        false -> false
                    end
            end
    end.

threshold_seconds(<<"daily">>) -> 86_400;
threshold_seconds(<<"weekly">>) -> 604_800;
threshold_seconds(<<"per_handoff">>) -> infinity;
threshold_seconds(_) -> 86_400.

iso_to_seconds(<<>>) -> none;
iso_to_seconds(Iso) when is_binary(Iso) ->
    try calendar:rfc3339_to_system_time(binary_to_list(Iso), [{unit, second}]) of
        Sec when is_integer(Sec) -> {ok, Sec};
        _ -> none
    catch
        _:_ -> none
    end;
iso_to_seconds(_) -> none.

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

workspace_resource_exists(Db, ResourceKind, ResourceId, OrgId) ->
    {OpenedKind, Field} =
        case ResourceKind of
            <<"lane">> -> {<<"lane.opened">>, <<"lane_id">>};
            <<"queue_item">> -> {<<"queue_item.added">>, <<"queue_item_id">>};
            _ -> {<<>>, <<>>}
        end,
    case {OpenedKind, Field} of
        {<<>>, _} -> false;
        _ ->
            EscapedResourceId = iolist_to_binary(json_escape(to_binary(ResourceId))),
            Needle = <<"\"", Field/binary, "\":\"", EscapedResourceId/binary, "\"">>,
            Sql = <<"SELECT 1 FROM events WHERE kind = ?1 AND org_id = ?2 AND payload_json LIKE ?3 LIMIT 1">>,
            case esqlite3:prepare(Db, Sql) of
                {ok, Stmt} ->
                    case esqlite3:bind(Stmt, [OpenedKind, OrgId, <<"%", Needle/binary, "%">>]) of
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
            end
    end.

to_binary(undefined) -> <<>>;
to_binary(null) -> <<>>;
to_binary(V) when is_binary(V) -> V;
to_binary(V) when is_list(V) -> iolist_to_binary(V);
to_binary(V) when is_atom(V) -> atom_to_binary(V, utf8);
to_binary(V) when is_integer(V) -> integer_to_binary(V).

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

select_chronicle_events(Db) ->
    Sql = <<"SELECT txid, kind, ts, actor, org_id, space_id, project_id, payload_json
             FROM events ORDER BY txid DESC LIMIT 240">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_chronicle_event_rows(Stmt, []);
        {error, _} -> []
    end.

select_events_like(Db, Pattern, Limit) ->
    Sql = <<"SELECT txid, kind, ts, payload_json FROM events WHERE kind LIKE ?1 ORDER BY txid ASC LIMIT ?2">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [Pattern, integer_to_binary(Limit)]) of
                ok -> collect_event_rows(Stmt, []);
                _ -> []
            end;
        {error, _} -> []
    end.

%% Like select_events_like/3 but returns 7-tuples that include the
%% envelope-level scope columns (org_id, space_id, project_id). Used by
%% projections that need per-row scope (e.g. auto_checkup_due_lanes/1).
select_events_like_with_scope(Db, Pattern, Limit) ->
    Sql = <<"SELECT txid, kind, ts, org_id, space_id, project_id, payload_json
             FROM events WHERE kind LIKE ?1 ORDER BY txid ASC LIMIT ?2">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} ->
            case esqlite3:bind(Stmt, [Pattern, integer_to_binary(Limit)]) of
                ok -> collect_event_with_scope_rows(Stmt, []);
                _ -> []
            end;
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

collect_event_with_scope_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Txid, Kind, Ts, OrgId, SpaceId, ProjectId, Payload] ->
            collect_event_with_scope_rows(Stmt,
                [event_with_scope_tuple(Txid, Kind, Ts, OrgId, SpaceId, ProjectId, Payload) | Acc]);
        {row, {Txid, Kind, Ts, OrgId, SpaceId, ProjectId, Payload}} ->
            collect_event_with_scope_rows(Stmt,
                [event_with_scope_tuple(Txid, Kind, Ts, OrgId, SpaceId, ProjectId, Payload) | Acc]);
        {row, [Txid, Kind, Ts, OrgId, SpaceId, ProjectId, Payload]} ->
            collect_event_with_scope_rows(Stmt,
                [event_with_scope_tuple(Txid, Kind, Ts, OrgId, SpaceId, ProjectId, Payload) | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

event_with_scope_tuple(Txid, Kind, Ts, OrgId, SpaceId, ProjectId, Payload) ->
    {Txid, to_binary(Kind), to_binary(Ts),
     to_binary(OrgId), to_binary(SpaceId), to_binary(ProjectId),
     to_binary(Payload)}.

collect_chronicle_event_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload] ->
            collect_chronicle_event_rows(
                Stmt,
                [chronicle_event_tuple(Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload) | Acc]
            );
        {row, {Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload}} ->
            collect_chronicle_event_rows(
                Stmt,
                [chronicle_event_tuple(Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload) | Acc]
            );
        {row, [Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload]} ->
            collect_chronicle_event_rows(
                Stmt,
                [chronicle_event_tuple(Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload) | Acc]
            );
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

chronicle_event_tuple(Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload) ->
    {Txid, to_binary(Kind), to_binary(Ts), to_binary(Actor), to_binary(OrgId),
     to_binary(SpaceId), to_binary(ProjectId), to_binary(Payload)}.

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

select_invites(Db) ->
    Sql = <<"SELECT id, org_id, target_kind, target_value, role, status, expires_at, updated_at
             FROM invites ORDER BY updated_at DESC, id DESC LIMIT 20">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_invite_rows(Stmt, []);
        {error, _} -> []
    end.

select_project_filesystems(Db) ->
    Sql = <<"SELECT id, space_id, org_id, name, local_path, materialization_status, materialization_reason
             FROM projects ORDER BY created_at DESC, id DESC LIMIT 100">>,
    case esqlite3:prepare(Db, Sql) of
        {ok, Stmt} -> collect_project_filesystem_rows(Stmt, []);
        {error, _} -> []
    end.

collect_project_filesystem_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, SpaceId, OrgId, Name, LocalPath, Status, Reason] ->
            collect_project_filesystem_rows(Stmt, [{to_binary(Id), to_binary(SpaceId), to_binary(OrgId), to_binary(Name), to_binary(LocalPath), to_binary(Status), to_binary(Reason)} | Acc]);
        {row, {Id, SpaceId, OrgId, Name, LocalPath, Status, Reason}} ->
            collect_project_filesystem_rows(Stmt, [{to_binary(Id), to_binary(SpaceId), to_binary(OrgId), to_binary(Name), to_binary(LocalPath), to_binary(Status), to_binary(Reason)} | Acc]);
        {row, [Id, SpaceId, OrgId, Name, LocalPath, Status, Reason]} ->
            collect_project_filesystem_rows(Stmt, [{to_binary(Id), to_binary(SpaceId), to_binary(OrgId), to_binary(Name), to_binary(LocalPath), to_binary(Status), to_binary(Reason)} | Acc]);
        '$done' -> lists:reverse(Acc);
        _ -> lists:reverse(Acc)
    end.

collect_invite_rows(Stmt, Acc) ->
    case esqlite3:step(Stmt) of
        [Id, OrgId, TargetKind, TargetValue, Role, Status, ExpiresAt, UpdatedAt] ->
            collect_invite_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(TargetKind), to_binary(TargetValue), to_binary(Role), to_binary(Status), to_binary(ExpiresAt), to_binary(UpdatedAt)} | Acc]);
        {row, {Id, OrgId, TargetKind, TargetValue, Role, Status, ExpiresAt, UpdatedAt}} ->
            collect_invite_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(TargetKind), to_binary(TargetValue), to_binary(Role), to_binary(Status), to_binary(ExpiresAt), to_binary(UpdatedAt)} | Acc]);
        {row, [Id, OrgId, TargetKind, TargetValue, Role, Status, ExpiresAt, UpdatedAt]} ->
            collect_invite_rows(Stmt, [{to_binary(Id), to_binary(OrgId), to_binary(TargetKind), to_binary(TargetValue), to_binary(Role), to_binary(Status), to_binary(ExpiresAt), to_binary(UpdatedAt)} | Acc]);
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

invite_json(Id, OrgId, TargetKind, TargetValue, Role, Status, ExpiresAt, UpdatedAt) ->
    [
        <<"{\"invite_id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"target_kind\":\"">>, json_escape(TargetKind), <<"\",">>,
        <<"\"target_value\":\"">>, json_escape(TargetValue), <<"\",">>,
        <<"\"role\":\"">>, json_escape(Role), <<"\",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\",">>,
        <<"\"expires_at\":\"">>, json_escape(ExpiresAt), <<"\",">>,
        <<"\"updated_at\":\"">>, json_escape(UpdatedAt), <<"\"}">>
    ].

project_filesystem_json(Id, SpaceId, OrgId, Name, LocalPath, Status, Reason) ->
    [
        <<"{\"project_id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"space_id\":\"">>, json_escape(SpaceId), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"name\":\"">>, json_escape(Name), <<"\",">>,
        <<"\"local_path\":\"">>, json_escape(LocalPath), <<"\",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\",">>,
        <<"\"reason\":\"">>, json_escape(Reason), <<"\"}">>
    ].

vapp_json(InstallationId, Slug, Label, Status, ProjectName, Enabled, SortOrder) ->
    [
        <<"{\"installation_id\":\"">>, json_escape(InstallationId), <<"\",">>,
        <<"\"vapp_id\":\"vapp:">>, json_escape(Slug), <<"\",">>,
        <<"\"slug\":\"">>, json_escape(Slug), <<"\",">>,
        <<"\"label\":\"">>, json_escape(Label), <<"\",">>,
        <<"\"status\":\"">>, json_escape(Status), <<"\",">>,
        <<"\"project_name\":\"">>, json_escape(ProjectName), <<"\",">>,
        <<"\"enabled\":">>, case Enabled of true -> <<"true">>; false -> <<"false">> end, <<",">>,
        <<"\"sort_order\":">>, integer_to_binary(SortOrder), <<",">>,
        <<"\"config\":{}">>,
        <<"}">>
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
            <<"lane.opened">> -> <<"Opened lane: ", (extract_json_string(Payload, <<"title">>))/binary>>;
            <<"queue_item.added">> -> <<"Queued: ", (extract_json_string(Payload, <<"title">>))/binary>>;
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

chronicle_sessions(Events) ->
    SessionMap = lists:foldl(fun chronicle_apply_session/2, #{}, Events),
    chronicle_sort_sessions(maps:values(SessionMap)).

chronicle_apply_session({Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, _Payload}, Acc) ->
    SessionId = chronicle_session_id(ProjectId, Actor),
    Current = maps:get(SessionId, Acc, #{
        id => SessionId,
        actor => Actor,
        org_id => OrgId,
        space_id => SpaceId,
        project_id => ProjectId,
        started_at => Ts,
        last_event_at => Ts,
        event_count => 0,
        latest_kind => Kind,
        latest_txid => Txid
    }),
    Acc#{SessionId => Current#{
        started_at => chronicle_min_ts(maps:get(started_at, Current), Ts),
        last_event_at => chronicle_max_ts(maps:get(last_event_at, Current), Ts),
        event_count => maps:get(event_count, Current) + 1,
        latest_kind => Kind,
        latest_txid => max(maps:get(latest_txid, Current), Txid)
    }}.

chronicle_source_stats(Events) ->
    SourceMap = lists:foldl(fun chronicle_apply_source/2, #{}, Events),
    chronicle_sort_sources(maps:values(SourceMap)).

chronicle_apply_source({_Txid, Kind, Ts, _Actor, _OrgId, _SpaceId, _ProjectId, _Payload}, Acc) ->
    Source = chronicle_source(Kind),
    Current = maps:get(Source, Acc, #{
        source => Source,
        event_count => 0,
        latest_at => Ts
    }),
    Acc#{Source => Current#{
        event_count => maps:get(event_count, Current) + 1,
        latest_at => chronicle_max_ts(maps:get(latest_at, Current), Ts)
    }}.

chronicle_sort_sessions(Sessions) ->
    lists:sort(
        fun(A, B) ->
            maps:get(last_event_at, A, <<>>) >= maps:get(last_event_at, B, <<>>)
        end,
        Sessions
    ).

chronicle_sort_sources(Sources) ->
    lists:sort(
        fun(A, B) ->
            maps:get(event_count, A, 0) >= maps:get(event_count, B, 0)
        end,
        Sources
    ).

chronicle_min_ts(<<>>, B) -> B;
chronicle_min_ts(A, <<>>) -> A;
chronicle_min_ts(A, B) when A =< B -> A;
chronicle_min_ts(_A, B) -> B.

chronicle_max_ts(A, B) when A >= B -> A;
chronicle_max_ts(_A, B) -> B.

chronicle_session_id(<<>>, Actor) -> <<"actor:", Actor/binary>>;
chronicle_session_id(ProjectId, _Actor) -> ProjectId.

chronicle_source(Kind) ->
    case binary:split(Kind, <<".">>) of
        [Prefix, _Rest] -> Prefix;
        [Only] -> Only
    end.

chronicle_label(Kind, Payload) ->
    Label =
        case Kind of
            <<"org.created">> -> <<"Created organization ", (extract_json_string(Payload, <<"name">>))/binary>>;
            <<"space.created">> -> <<"Created space ", (extract_json_string(Payload, <<"name">>))/binary>>;
            <<"project.created">> -> <<"Created project ", (extract_json_string(Payload, <<"name">>))/binary>>;
            <<"lane.opened">> -> <<"Opened lane: ", (extract_json_string(Payload, <<"title">>))/binary>>;
            <<"queue_item.added">> -> <<"Queued: ", (extract_json_string(Payload, <<"title">>))/binary>>;
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
    json_escape(Label).

chronicle_event_json({Txid, Kind, Ts, Actor, OrgId, SpaceId, ProjectId, Payload}) ->
    Source = chronicle_source(Kind),
    SessionId = chronicle_session_id(ProjectId, Actor),
    Label = chronicle_label(Kind, Payload),
    [
        <<"{\"id\":\"event-tx-">>, integer_to_binary(Txid), <<"\",">>,
        <<"\"txid\":">>, integer_to_binary(Txid), <<",">>,
        <<"\"kind\":\"">>, json_escape(Kind), <<"\",">>,
        <<"\"source\":\"">>, json_escape(Source), <<"\",">>,
        <<"\"session_id\":\"">>, json_escape(SessionId), <<"\",">>,
        <<"\"actor\":\"">>, json_escape(Actor), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(OrgId), <<"\",">>,
        <<"\"space_id\":">>, nullable_string_json(SpaceId), <<",">>,
        <<"\"project_id\":">>, nullable_string_json(ProjectId), <<",">>,
        <<"\"ts\":\"">>, json_escape(Ts), <<"\",">>,
        <<"\"label\":\"">>, Label, <<"\"}">>
    ].

chronicle_session_json(Session) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, Session)), <<"\",">>,
        <<"\"actor\":\"">>, json_escape(maps:get(actor, Session)), <<"\",">>,
        <<"\"org_id\":\"">>, json_escape(maps:get(org_id, Session)), <<"\",">>,
        <<"\"space_id\":">>, nullable_string_json(maps:get(space_id, Session)), <<",">>,
        <<"\"project_id\":">>, nullable_string_json(maps:get(project_id, Session)), <<",">>,
        <<"\"started_at\":\"">>, json_escape(maps:get(started_at, Session)), <<"\",">>,
        <<"\"last_event_at\":\"">>, json_escape(maps:get(last_event_at, Session)), <<"\",">>,
        <<"\"event_count\":">>, integer_to_binary(maps:get(event_count, Session)), <<",">>,
        <<"\"latest_kind\":\"">>, json_escape(maps:get(latest_kind, Session)), <<"\"}">>
    ].

chronicle_source_json(Source) ->
    [
        <<"{\"source\":\"">>, json_escape(maps:get(source, Source)), <<"\",">>,
        <<"\"event_count\":">>, integer_to_binary(maps:get(event_count, Source)), <<",">>,
        <<"\"latest_at\":\"">>, json_escape(maps:get(latest_at, Source)), <<"\"}">>
    ].

apply_lane_event({_Txid, Kind, Ts, Payload}, Acc) ->
    LaneId = extract_json_string(Payload, <<"lane_id">>),
    case LaneId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(LaneId, Acc, lane_default(LaneId)),
            Next =
                case Kind of
                    <<"lane.opened">> ->
                        Current#{
                            title => extract_json_string(Payload, <<"title">>),
                            name => extract_json_string(Payload, <<"name">>),
                            project_id => extract_json_string(Payload, <<"project_id">>),
                            mission_id => extract_json_string(Payload, <<"mission_id">>),
                            scope => extract_json_string(Payload, <<"scope">>),
                            done_when => extract_json_string(Payload, <<"done_when">>),
                            depends_on => extract_json_string(Payload, <<"depends_on">>),
                            opened_by => extract_json_string(Payload, <<"opened_by">>),
                            status => non_empty(extract_json_string(Payload, <<"status">>), <<"idea">>),
                            blueprint_section_id => extract_json_string(Payload, <<"blueprint_section_id">>),
                            blueprint_gac_id => extract_json_string(Payload, <<"blueprint_gac_id">>),
                            blueprint_decision_id => extract_json_string(Payload, <<"blueprint_decision_id">>),
                            lane_cadence => extract_json_string(Payload, <<"lane_cadence">>),
                            opened_at => Ts,
                            updated_at => Ts
                        };
                    <<"lane.claimed">> ->
                        Current#{
                            actor_id => extract_json_string(Payload, <<"actor_id">>),
                            claim_scope => extract_json_string(Payload, <<"scope">>),
                            goal => extract_json_string(Payload, <<"goal">>),
                            next => extract_json_string(Payload, <<"next">>),
                            refresh_by => extract_json_string(Payload, <<"refresh_by">>),
                            blocker => extract_json_string(Payload, <<"blocker">>),
                            status => <<"active">>,
                            updated_at => Ts
                        };
                    <<"lane.moved">> ->
                        Current#{
                            status => non_empty(extract_json_string(Payload, <<"to_status">>), maps:get(status, Current)),
                            updated_at => Ts
                        };
                    <<"lane.blocked">> ->
                        Current#{
                            status => <<"blocked">>,
                            blocked_reason => extract_json_string(Payload, <<"reason">>),
                            blocked_by => extract_json_string(Payload, <<"blocked_by">>),
                            depends_on => non_empty(extract_json_string(Payload, <<"depends_on">>), maps:get(depends_on, Current)),
                            updated_at => Ts
                        };
                    <<"lane.released">> ->
                        Current#{
                            actor_id => <<>>,
                            release_reason => extract_json_string(Payload, <<"reason">>),
                            handoff_id => extract_json_string(Payload, <<"handoff_id">>),
                            updated_at => Ts
                        };
                    <<"lane.closed">> ->
                        Current#{
                            status => <<"done">>,
                            close_reason => extract_json_string(Payload, <<"reason">>),
                            verify => extract_json_string(Payload, <<"verify">>),
                            closed_by => extract_json_string(Payload, <<"closed_by">>),
                            updated_at => Ts
                        };
                    _ -> Current#{updated_at => Ts}
                end,
            Acc#{LaneId => Next}
    end.

lane_default(LaneId) ->
    #{
        id => LaneId,
        title => <<>>,
        name => <<>>,
        project_id => <<>>,
        mission_id => <<>>,
        scope => <<>>,
        claim_scope => <<>>,
        done_when => <<>>,
        depends_on => <<>>,
        opened_by => <<>>,
        actor_id => <<>>,
        goal => <<>>,
        next => <<>>,
        refresh_by => <<>>,
        blocker => <<>>,
        blocked_reason => <<>>,
        blocked_by => <<>>,
        release_reason => <<>>,
        handoff_id => <<>>,
        close_reason => <<>>,
        verify => <<>>,
        closed_by => <<>>,
        blueprint_section_id => <<>>,
        blueprint_gac_id => <<>>,
        blueprint_decision_id => <<>>,
        lane_cadence => <<>>,
        status => <<"idea">>,
        opened_at => <<>>,
        updated_at => <<>>,
        %% Envelope-level scope captured by apply_lane_event_with_scope/2.
        %% project_id above comes from the lane.opened payload; these two
        %% come from the envelope columns and are used by the auto-checkup
        %% tick to emit each checkup with the lane's actual org/space.
        env_org_id => <<>>,
        env_space_id => <<>>
    }.

apply_queue_event({_Txid, Kind, Ts, Payload}, Acc) ->
    QueueItemId = extract_json_string(Payload, <<"queue_item_id">>),
    case QueueItemId of
        <<>> -> Acc;
        _ ->
            Current = maps:get(QueueItemId, Acc, queue_default(QueueItemId)),
            Next =
                case Kind of
                    <<"queue_item.added">> ->
                        Current#{
                            title => extract_json_string(Payload, <<"title">>),
                            why => extract_json_string(Payload, <<"why">>),
                            project_id => extract_json_string(Payload, <<"project_id">>),
                            mission_id => extract_json_string(Payload, <<"mission_id">>),
                            lane_id => extract_json_string(Payload, <<"lane_id">>),
                            done_when => extract_json_string(Payload, <<"done_when">>),
                            depends_on => extract_json_string(Payload, <<"depends_on">>),
                            blocked_by => extract_json_string(Payload, <<"blocked_by">>),
                            source => extract_json_string(Payload, <<"source">>),
                            added_by => extract_json_string(Payload, <<"added_by">>),
                            status => non_empty(extract_json_string(Payload, <<"status">>), <<"ready">>),
                            blueprint_section_id => extract_json_string(Payload, <<"blueprint_section_id">>),
                            blueprint_gac_id => extract_json_string(Payload, <<"blueprint_gac_id">>),
                            blueprint_decision_id => extract_json_string(Payload, <<"blueprint_decision_id">>),
                            added_at => Ts,
                            updated_at => Ts
                        };
                    <<"queue_item.ready">> ->
                        Current#{
                            status => <<"ready">>,
                            ready_reason => extract_json_string(Payload, <<"reason">>),
                            marked_by => extract_json_string(Payload, <<"marked_by">>),
                            updated_at => Ts
                        };
                    <<"queue_item.blocked">> ->
                        Current#{
                            status => <<"blocked">>,
                            blocked_by => extract_json_string(Payload, <<"blocked_by">>),
                            blocked_reason => extract_json_string(Payload, <<"reason">>),
                            marked_by => extract_json_string(Payload, <<"marked_by">>),
                            updated_at => Ts
                        };
                    <<"queue_item.closed">> ->
                        Current#{
                            status => <<"closed">>,
                            result => extract_json_string(Payload, <<"result">>),
                            verify => extract_json_string(Payload, <<"verify">>),
                            closed_by => extract_json_string(Payload, <<"closed_by">>),
                            updated_at => Ts
                        };
                    _ -> Current#{updated_at => Ts}
                end,
            Acc#{QueueItemId => Next}
    end.

queue_default(QueueItemId) ->
    #{
        id => QueueItemId,
        title => <<>>,
        why => <<>>,
        project_id => <<>>,
        mission_id => <<>>,
        lane_id => <<>>,
        done_when => <<>>,
        depends_on => <<>>,
        blocked_by => <<>>,
        source => <<>>,
        added_by => <<>>,
        marked_by => <<>>,
        ready_reason => <<>>,
        blocked_reason => <<>>,
        result => <<>>,
        verify => <<>>,
        closed_by => <<>>,
        blueprint_section_id => <<>>,
        blueprint_gac_id => <<>>,
        blueprint_decision_id => <<>>,
        status => <<"ready">>,
        added_at => <<>>,
        updated_at => <<>>
    }.

apply_campaign_event({_Txid, Kind, Ts, Payload}, Acc) ->
    Id = extract_json_string(Payload, <<"campaign_id">>),
    case Id of
        <<>> -> Acc;
        _ ->
            Current = maps:get(Id, Acc, workspace_default(Id)),
            Next0 = Current#{
                id => Id,
                title => non_empty(extract_json_string(Payload, <<"title">>), maps:get(title, Current, <<>>)),
                project_id => non_empty(extract_json_string(Payload, <<"project_id">>), maps:get(project_id, Current, <<>>)),
                depends_on => non_empty(extract_json_string(Payload, <<"depends_on">>), maps:get(depends_on, Current, <<>>)),
                done_when => non_empty(extract_json_string(Payload, <<"done_when">>), maps:get(done_when, Current, <<>>)),
                updated_at => Ts
            },
            Next = case Kind of
                <<"campaign.created">> -> Next0#{status => <<"active">>, created_at => Ts};
                <<"campaign.archived">> -> Next0#{
                    status => <<"archived">>,
                    reason => extract_json_string(Payload, <<"reason">>),
                    archived_by => extract_json_string(Payload, <<"archived_by">>)
                };
                _ -> Next0
            end,
            Acc#{Id => Next}
    end.

apply_mission_event({_Txid, Kind, Ts, Payload}, Acc) ->
    Id = extract_json_string(Payload, <<"mission_id">>),
    case Id of
        <<>> -> Acc;
        _ ->
            Current = maps:get(Id, Acc, workspace_default(Id)),
            Next0 = Current#{
                id => Id,
                campaign_id => non_empty(extract_json_string(Payload, <<"campaign_id">>), maps:get(campaign_id, Current, <<>>)),
                title => non_empty(extract_json_string(Payload, <<"title">>), maps:get(title, Current, <<>>)),
                project_id => non_empty(extract_json_string(Payload, <<"project_id">>), maps:get(project_id, Current, <<>>)),
                depends_on => non_empty(extract_json_string(Payload, <<"depends_on">>), maps:get(depends_on, Current, <<>>)),
                done_when => non_empty(extract_json_string(Payload, <<"done_when">>), maps:get(done_when, Current, <<>>)),
                updated_at => Ts
            },
            Next = case Kind of
                <<"mission.created">> -> Next0#{status => <<"ready">>, created_at => Ts};
                <<"mission.started">> -> Next0#{status => <<"active">>, started_by => extract_json_string(Payload, <<"started_by">>)};
                <<"mission.paused">> -> Next0#{status => <<"paused">>, reason => extract_json_string(Payload, <<"reason">>)};
                <<"mission.completed">> -> Next0#{status => <<"completed">>, result => extract_json_string(Payload, <<"result">>), verify => extract_json_string(Payload, <<"verify">>)};
                _ -> Next0
            end,
            Acc#{Id => Next}
    end.

apply_handoff_event({_Txid, Kind, Ts, Payload}, Acc) ->
    Id = extract_json_string(Payload, <<"handoff_id">>),
    case Id of
        <<>> -> Acc;
        _ ->
            Current = maps:get(Id, Acc, workspace_default(Id)),
            Next0 = Current#{
                id => Id,
                from => non_empty(extract_json_string(Payload, <<"from">>), maps:get(from, Current, <<>>)),
                to => non_empty(extract_json_string(Payload, <<"to">>), maps:get(to, Current, <<>>)),
                needed => non_empty(extract_json_string(Payload, <<"needed">>), maps:get(needed, Current, <<>>)),
                context => non_empty(extract_json_string(Payload, <<"context">>), maps:get(context, Current, <<>>)),
                updated_at => Ts
            },
            Next = case Kind of
                <<"handoff.requested">> -> Next0#{status => <<"pending">>, created_at => Ts};
                <<"handoff.accepted">> -> Next0#{status => <<"accepted">>, accepted_by => extract_json_string(Payload, <<"accepted_by">>)};
                <<"handoff.rejected">> -> Next0#{status => <<"rejected">>, reason => extract_json_string(Payload, <<"reason">>)};
                <<"handoff.completed">> -> Next0#{status => <<"completed">>, outcome => extract_json_string(Payload, <<"outcome">>), verify => extract_json_string(Payload, <<"verify">>)};
                _ -> Next0
            end,
            Acc#{Id => Next}
    end.

apply_problem_event({_Txid, Kind, Ts, Payload}, {Problems, Solutions, Links}) ->
    case Kind of
        <<"problem.logged">> ->
            Id = extract_json_string(Payload, <<"problem_id">>),
            Problem = (workspace_default(Id))#{
                id => Id,
                title => extract_json_string(Payload, <<"title">>),
                project_id => extract_json_string(Payload, <<"project_id">>),
                lane_id => extract_json_string(Payload, <<"lane_id">>),
                depends_on => extract_json_string(Payload, <<"depends_on">>),
                cause => extract_json_string(Payload, <<"cause">>),
                source => extract_json_string(Payload, <<"source">>),
                status => <<"open">>,
                created_at => Ts,
                updated_at => Ts
            },
            {Problems#{Id => Problem}, Solutions, Links};
        <<"problem.solution_added">> ->
            Solution = (workspace_default(extract_json_string(Payload, <<"solution_id">>)))#{
                id => extract_json_string(Payload, <<"solution_id">>),
                problem_id => extract_json_string(Payload, <<"problem_id">>),
                title => extract_json_string(Payload, <<"title">>),
                verify => extract_json_string(Payload, <<"verify">>),
                source => extract_json_string(Payload, <<"source">>),
                updated_at => Ts
            },
            {Problems, [Solution | Solutions], Links};
        <<"problem.linked">> ->
            {Problems, Solutions, [#{
                problem_id => extract_json_string(Payload, <<"problem_id">>),
                from => extract_json_string(Payload, <<"from">>),
                to => extract_json_string(Payload, <<"to">>),
                relation => extract_json_string(Payload, <<"relation">>),
                updated_at => Ts
            } | Links]};
        _ -> {Problems, Solutions, Links}
    end.

workspace_default(Id) ->
    #{
        id => Id,
        title => <<>>,
        status => <<"open">>,
        project_id => <<>>,
        campaign_id => <<>>,
        lane_id => <<>>,
        depends_on => <<>>,
        done_when => <<>>,
        reason => <<>>,
        result => <<>>,
        verify => <<>>,
        source => <<>>,
        created_at => <<>>,
        updated_at => <<>>,
        from => <<>>,
        to => <<>>,
        needed => <<>>,
        context => <<>>,
        outcome => <<>>
    }.

sort_by_updated(Items) ->
    lists:sort(
        fun(A, B) ->
            maps:get(updated_at, A, <<>>) >= maps:get(updated_at, B, <<>>)
        end,
        Items
    ).

lane_registry_json(Lane) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, Lane)), <<"\",">>,
        <<"\"lane_id\":\"">>, json_escape(maps:get(id, Lane)), <<"\",">>,
        <<"\"title\":\"">>, json_escape(maps:get(title, Lane)), <<"\",">>,
        <<"\"name\":\"">>, json_escape(non_empty(maps:get(name, Lane), maps:get(title, Lane))), <<"\",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, Lane)), <<"\",">>,
        <<"\"project_id\":">>, nullable_string_json(maps:get(project_id, Lane)), <<",">>,
        <<"\"mission_id\":">>, nullable_string_json(maps:get(mission_id, Lane)), <<",">>,
        <<"\"scope\":">>, nullable_string_json(maps:get(scope, Lane)), <<",">>,
        <<"\"claim_scope\":">>, nullable_string_json(maps:get(claim_scope, Lane)), <<",">>,
        <<"\"done_when\":">>, nullable_string_json(maps:get(done_when, Lane)), <<",">>,
        <<"\"depends_on\":">>, nullable_string_json(maps:get(depends_on, Lane)), <<",">>,
        <<"\"opened_by\":">>, nullable_string_json(maps:get(opened_by, Lane)), <<",">>,
        <<"\"actor_id\":">>, nullable_string_json(maps:get(actor_id, Lane)), <<",">>,
        <<"\"goal\":">>, nullable_string_json(maps:get(goal, Lane)), <<",">>,
        <<"\"next\":">>, nullable_string_json(maps:get(next, Lane)), <<",">>,
        <<"\"blocker\":">>, nullable_string_json(maps:get(blocker, Lane)), <<",">>,
        <<"\"blocked_reason\":">>, nullable_string_json(maps:get(blocked_reason, Lane)), <<",">>,
        <<"\"linked_blueprint\":{">>,
            <<"\"section_id\":">>, nullable_string_json(maps:get(blueprint_section_id, Lane, <<>>)), <<",">>,
            <<"\"gac_id\":">>, nullable_string_json(maps:get(blueprint_gac_id, Lane, <<>>)), <<",">>,
            <<"\"decision_id\":">>, nullable_string_json(maps:get(blueprint_decision_id, Lane, <<>>)),
        <<"},">>,
        <<"\"lane_cadence\":">>, nullable_string_json(maps:get(lane_cadence, Lane, <<>>)), <<",">>,
        <<"\"opened_at\":">>, nullable_string_json(maps:get(opened_at, Lane)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, Lane)), <<"}">>
    ].

queue_registry_json(Item) ->
    [
        <<"{\"id\":\"">>, json_escape(maps:get(id, Item)), <<"\",">>,
        <<"\"queue_item_id\":\"">>, json_escape(maps:get(id, Item)), <<"\",">>,
        <<"\"title\":\"">>, json_escape(maps:get(title, Item)), <<"\",">>,
        <<"\"why\":\"">>, json_escape(maps:get(why, Item)), <<"\",">>,
        <<"\"status\":\"">>, json_escape(maps:get(status, Item)), <<"\",">>,
        <<"\"project_id\":">>, nullable_string_json(maps:get(project_id, Item)), <<",">>,
        <<"\"mission_id\":">>, nullable_string_json(maps:get(mission_id, Item)), <<",">>,
        <<"\"lane_id\":">>, nullable_string_json(maps:get(lane_id, Item)), <<",">>,
        <<"\"done_when\":">>, nullable_string_json(maps:get(done_when, Item)), <<",">>,
        <<"\"depends_on\":">>, nullable_string_json(maps:get(depends_on, Item)), <<",">>,
        <<"\"blocked_by\":">>, nullable_string_json(maps:get(blocked_by, Item)), <<",">>,
        <<"\"source\":">>, nullable_string_json(maps:get(source, Item)), <<",">>,
        <<"\"added_by\":">>, nullable_string_json(maps:get(added_by, Item)), <<",">>,
        <<"\"blocked_reason\":">>, nullable_string_json(maps:get(blocked_reason, Item)), <<",">>,
        <<"\"result\":">>, nullable_string_json(maps:get(result, Item)), <<",">>,
        <<"\"linked_blueprint\":{">>,
            <<"\"section_id\":">>, nullable_string_json(maps:get(blueprint_section_id, Item, <<>>)), <<",">>,
            <<"\"gac_id\":">>, nullable_string_json(maps:get(blueprint_gac_id, Item, <<>>)), <<",">>,
            <<"\"decision_id\":">>, nullable_string_json(maps:get(blueprint_decision_id, Item, <<>>)),
        <<"},">>,
        <<"\"added_at\":">>, nullable_string_json(maps:get(added_at, Item)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, Item)), <<"}">>
    ].

workspace_record_json(IdKey, Item) ->
    Id = maps:get(id, Item, <<>>),
    [
        <<"{\"id\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"">>, atom_to_binary(IdKey, utf8), <<"\":\"">>, json_escape(Id), <<"\",">>,
        <<"\"title\":">>, nullable_string_json(maps:get(title, Item, <<>>)), <<",">>,
        <<"\"status\":">>, nullable_string_json(maps:get(status, Item, <<>>)), <<",">>,
        <<"\"project_id\":">>, nullable_string_json(maps:get(project_id, Item, <<>>)), <<",">>,
        <<"\"campaign_id\":">>, nullable_string_json(maps:get(campaign_id, Item, <<>>)), <<",">>,
        <<"\"lane_id\":">>, nullable_string_json(maps:get(lane_id, Item, <<>>)), <<",">>,
        <<"\"depends_on\":">>, nullable_string_json(maps:get(depends_on, Item, <<>>)), <<",">>,
        <<"\"done_when\":">>, nullable_string_json(maps:get(done_when, Item, <<>>)), <<",">>,
        <<"\"reason\":">>, nullable_string_json(maps:get(reason, Item, <<>>)), <<",">>,
        <<"\"result\":">>, nullable_string_json(maps:get(result, Item, <<>>)), <<",">>,
        <<"\"verify\":">>, nullable_string_json(maps:get(verify, Item, <<>>)), <<",">>,
        <<"\"source\":">>, nullable_string_json(maps:get(source, Item, <<>>)), <<",">>,
        <<"\"from\":">>, nullable_string_json(maps:get(from, Item, <<>>)), <<",">>,
        <<"\"to\":">>, nullable_string_json(maps:get(to, Item, <<>>)), <<",">>,
        <<"\"needed\":">>, nullable_string_json(maps:get(needed, Item, <<>>)), <<",">>,
        <<"\"context\":">>, nullable_string_json(maps:get(context, Item, <<>>)), <<",">>,
        <<"\"outcome\":">>, nullable_string_json(maps:get(outcome, Item, <<>>)), <<",">>,
        <<"\"created_at\":">>, nullable_string_json(maps:get(created_at, Item, <<>>)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, Item, <<>>)), <<"}">>
    ].

workspace_link_json(Item) ->
    [
        <<"{\"problem_id\":">>, nullable_string_json(maps:get(problem_id, Item, <<>>)), <<",">>,
        <<"\"from\":">>, nullable_string_json(maps:get(from, Item, <<>>)), <<",">>,
        <<"\"to\":">>, nullable_string_json(maps:get(to, Item, <<>>)), <<",">>,
        <<"\"relation\":">>, nullable_string_json(maps:get(relation, Item, <<>>)), <<",">>,
        <<"\"updated_at\":">>, nullable_string_json(maps:get(updated_at, Item, <<>>)), <<"}">>
    ].

agent_report_event_json({_Txid, _Kind, Ts, Payload}) ->
    [
        <<"{\"id\":\"">>, json_escape(extract_json_string(Payload, <<"report_id">>)), <<"\",">>,
        <<"\"report_id\":\"">>, json_escape(extract_json_string(Payload, <<"report_id">>)), <<"\",">>,
        <<"\"actor_id\":">>, nullable_string_json(extract_json_string(Payload, <<"actor_id">>)), <<",">>,
        <<"\"lane_id\":">>, nullable_string_json(extract_json_string(Payload, <<"lane_id">>)), <<",">>,
        <<"\"changed\":">>, nullable_string_json(extract_json_string(Payload, <<"changed">>)), <<",">>,
        <<"\"verified\":">>, nullable_string_json(extract_json_string(Payload, <<"verified">>)), <<",">>,
        <<"\"risks\":">>, nullable_string_json(extract_json_string(Payload, <<"risks">>)), <<",">>,
        <<"\"next\":">>, nullable_string_json(extract_json_string(Payload, <<"next">>)), <<",">>,
        <<"\"created_at\":\"">>, json_escape(Ts), <<"\"}">>
    ].

nullable_string_json(<<>>) ->
    <<"null">>;
nullable_string_json(Value) ->
    [<<"\"">>, json_escape(Value), <<"\"">>].

non_empty(<<>>, Fallback) ->
    Fallback;
non_empty(Value, _Fallback) ->
    Value.

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
