-module(ema_swarm_coordination@first_boot).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_swarm_coordination/first_boot.gleam").
-export([workspace/0, topbar_projection/0, see_agent_work_seed/0, first_boot_events/0]).
-export_type([actor_kind/0, actor/0, organization/0, space/0, project/0, blueprint_document/0, blueprint_section/0, codebase_record/0, first_boot_workspace/0, topbar_projection/0, see_agent_work_seed/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " First-boot workspace seed for EMA 0.0.5.\n"
    "\n"
    " This is daemon-side data. Surfaces may mirror it through mocked\n"
    " projections while IPC is stubbed, but this module is the canonical\n"
    " backend shape for the initial workspace.\n"
).

-type actor_kind() :: human | agent.

-type actor() :: {actor, binary(), binary(), actor_kind(), binary()}.

-type organization() :: {organization, binary(), binary()}.

-type space() :: {space, binary(), binary(), binary(), boolean()}.

-type project() :: {project, binary(), binary(), binary()}.

-type blueprint_document() :: {blueprint_document, binary(), binary(), binary()}.

-type blueprint_section() :: {blueprint_section,
        binary(),
        binary(),
        binary(),
        ema_daemon@event_envelope:option(binary())}.

-type codebase_record() :: {codebase_record,
        binary(),
        binary(),
        binary(),
        binary(),
        binary()}.

-type first_boot_workspace() :: {first_boot_workspace,
        organization(),
        space(),
        project(),
        list(actor()),
        blueprint_document(),
        list(blueprint_section()),
        codebase_record()}.

-type topbar_projection() :: {topbar_projection,
        binary(),
        binary(),
        binary(),
        binary(),
        binary(),
        binary(),
        binary(),
        binary(),
        binary()}.

-type see_agent_work_seed() :: {see_agent_work_seed,
        binary(),
        binary(),
        list(binary()),
        list(binary()),
        list(binary()),
        list(binary()),
        list(binary())}.

-file("src/ema_swarm_coordination/first_boot.gleam", 117).
-spec workspace() -> first_boot_workspace().
workspace() ->
    {first_boot_workspace,
        {organization,
            <<"org:01J00000000000000000000001"/utf8>>,
            <<"Founding-Fathers-EMA"/utf8>>},
        {space,
            <<"space:01J00000000000000000000005"/utf8>>,
            <<"org:01J00000000000000000000001"/utf8>>,
            <<"Founding-Fathers-EMA"/utf8>>,
            true},
        {project,
            <<"project:01J00000000000000000000006"/utf8>>,
            <<"space:01J00000000000000000000005"/utf8>>,
            <<"EMA 0.0.5"/utf8>>},
        [{actor,
                <<"actor:01J00000000000000000000002"/utf8>>,
                <<"Trajan"/utf8>>,
                human,
                <<"founder-developer"/utf8>>},
            {actor,
                <<"actor:01J00000000000000000000003"/utf8>>,
                <<"Codex"/utf8>>,
                agent,
                <<"implementation-orchestrator"/utf8>>},
            {actor,
                <<"actor:01J00000000000000000000004"/utf8>>,
                <<"Claude"/utf8>>,
                agent,
                <<"concept-and-docs-orchestrator"/utf8>>}],
        {blueprint_document,
            <<"blueprint_doc:01J00000000000000000000007"/utf8>>,
            <<"project:01J00000000000000000000006"/utf8>>,
            <<"EMA 0.0.5 Blueprint"/utf8>>},
        [{blueprint_section,
                <<"blueprint_sec:01J00000000000000000000008"/utf8>>,
                <<"blueprint_doc:01J00000000000000000000007"/utf8>>,
                <<"Executive Management Assistant"/utf8>>,
                ema_daemon@event_envelope:none()},
            {blueprint_section,
                <<"blueprint_sec:01J00000000000000000000009"/utf8>>,
                <<"blueprint_doc:01J00000000000000000000007"/utf8>>,
                <<"Runtime source and git-ema evidence"/utf8>>,
                ema_daemon@event_envelope:some(
                    <<"blueprint_sec:01J00000000000000000000008"/utf8>>
                )}],
        {codebase_record,
            <<"codebase:01J00000000000000000000011"/utf8>>,
            <<"project:01J00000000000000000000006"/utf8>>,
            <<"EMA 0.0.5 runtime"/utf8>>,
            <<"/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24"/utf8>>,
            <<"attachment:01J00000000000000000000010"/utf8>>}}.

-file("src/ema_swarm_coordination/first_boot.gleam", 180).
-spec topbar_projection() -> topbar_projection().
topbar_projection() ->
    {topbar_projection,
        <<"user:01J00000000000000000000001"/utf8>>,
        <<"Trajan"/utf8>>,
        <<"org:01J00000000000000000000001"/utf8>>,
        <<"Founding-Fathers-EMA"/utf8>>,
        <<"space:01J00000000000000000000005"/utf8>>,
        <<"Founding-Fathers-EMA"/utf8>>,
        <<"project:01J00000000000000000000006"/utf8>>,
        <<"EMA 0.0.5"/utf8>>,
        <<"home"/utf8>>}.

-file("src/ema_swarm_coordination/first_boot.gleam", 194).
-spec see_agent_work_seed() -> see_agent_work_seed().
see_agent_work_seed() ->
    {see_agent_work_seed,
        <<"EMA 0.0.5 buildout swarm"/utf8>>,
        <<"Vanilla workspace ignition"/utf8>>,
        [<<"Build daemon-owned org/space/project seed"/utf8>>,
            <<"Make Blueprint, git-ema, and See Agent Work visible"/utf8>>,
            <<"Prepare localhost web shell for multi-surface work"/utf8>>],
        [<<"Contracts and event validation"/utf8>>,
            <<"Topbar projection"/utf8>>,
            <<"Blueprint default document"/utf8>>,
            <<"git-ema source attachment"/utf8>>,
            <<"See Agent Work mocked control room"/utf8>>],
        [<<"Real WebSocket IPC waits for daemon actor wiring"/utf8>>,
            <<"Real autonomous execution waits for Hermes seam"/utf8>>],
        [<<"Codex: implementation lanes and verification"/utf8>>,
            <<"Claude: doctrine, synthesis, and review"/utf8>>,
            <<"Human founder: approvals and canon promotion"/utf8>>],
        [<<"Start Swarm"/utf8>>,
            <<"Pause Swarm"/utf8>>,
            <<"Stop Swarm"/utf8>>,
            <<"Open Mission"/utf8>>,
            <<"Request Handoff"/utf8>>,
            <<"Schedule Checkup"/utf8>>]}.

-file("src/ema_swarm_coordination/first_boot.gleam", 319).
-spec envelope(
    binary(),
    binary(),
    ema_daemon@event_envelope:option(binary()),
    ema_daemon@event_envelope:option(binary()),
    binary()
) -> ema_daemon@event_envelope:envelope().
envelope(Event_id, Kind, Space_id, Project_id, Payload_json) ->
    {envelope,
        Event_id,
        Kind,
        <<"2026-04-24T00:00:00-04:00"/utf8>>,
        <<"actor:01J00000000000000000000002"/utf8>>,
        <<"org:01J00000000000000000000001"/utf8>>,
        Space_id,
        Project_id,
        ema_daemon@event_envelope:none(),
        ema_daemon@event_envelope:none(),
        Payload_json}.

-file("src/ema_swarm_coordination/first_boot.gleam", 230).
-spec first_boot_events() -> list(ema_daemon@event_envelope:envelope()).
first_boot_events() ->
    [envelope(
            <<"event:01J00000000000000000000101"/utf8>>,
            <<"actor.created"/utf8>>,
            ema_daemon@event_envelope:none(),
            ema_daemon@event_envelope:none(),
            <<"{\"actor_id\":\"actor:01J00000000000000000000002\",\"kind\":\"human\",\"display_name\":\"Trajan\",\"role\":\"founder-developer\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000102"/utf8>>,
            <<"actor.created"/utf8>>,
            ema_daemon@event_envelope:none(),
            ema_daemon@event_envelope:none(),
            <<"{\"actor_id\":\"actor:01J00000000000000000000003\",\"kind\":\"agent\",\"display_name\":\"Codex\",\"role\":\"implementation-orchestrator\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000103"/utf8>>,
            <<"actor.created"/utf8>>,
            ema_daemon@event_envelope:none(),
            ema_daemon@event_envelope:none(),
            <<"{\"actor_id\":\"actor:01J00000000000000000000004\",\"kind\":\"agent\",\"display_name\":\"Claude\",\"role\":\"concept-and-docs-orchestrator\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000104"/utf8>>,
            <<"org.created"/utf8>>,
            ema_daemon@event_envelope:none(),
            ema_daemon@event_envelope:none(),
            <<"{\"org_id\":\"org:01J00000000000000000000001\",\"name\":\"Founding-Fathers-EMA\",\"personal\":false,\"owner_user_id\":\"user:01J00000000000000000000001\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000105"/utf8>>,
            <<"space.created"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:none(),
            <<"{\"space_id\":\"space:01J00000000000000000000005\",\"org_id\":\"org:01J00000000000000000000001\",\"name\":\"Founding-Fathers-EMA\",\"created_by\":\"user:01J00000000000000000000001\",\"default\":true}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000106"/utf8>>,
            <<"project.created"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:some(
                <<"project:01J00000000000000000000006"/utf8>>
            ),
            <<"{\"project_id\":\"project:01J00000000000000000000006\",\"space_id\":\"space:01J00000000000000000000005\",\"name\":\"EMA 0.0.5\",\"created_by\":\"user:01J00000000000000000000001\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000107"/utf8>>,
            <<"blueprint.document.created"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:some(
                <<"project:01J00000000000000000000006"/utf8>>
            ),
            <<"{\"document_id\":\"blueprint_doc:01J00000000000000000000007\",\"project_id\":\"project:01J00000000000000000000006\",\"title\":\"EMA 0.0.5 Blueprint\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000108"/utf8>>,
            <<"blueprint.section.added"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:some(
                <<"project:01J00000000000000000000006"/utf8>>
            ),
            <<"{\"section_id\":\"blueprint_sec:01J00000000000000000000008\",\"document_id\":\"blueprint_doc:01J00000000000000000000007\",\"title\":\"Executive Management Assistant\",\"parent_id\":null}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000109"/utf8>>,
            <<"blueprint.section.added"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:some(
                <<"project:01J00000000000000000000006"/utf8>>
            ),
            <<"{\"section_id\":\"blueprint_sec:01J00000000000000000000009\",\"document_id\":\"blueprint_doc:01J00000000000000000000007\",\"title\":\"Runtime source and git-ema evidence\",\"parent_id\":\"blueprint_sec:01J00000000000000000000008\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000110"/utf8>>,
            <<"attachment.created"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:some(
                <<"project:01J00000000000000000000006"/utf8>>
            ),
            <<"{\"attachment_id\":\"attachment:01J00000000000000000000010\",\"kind\":\"git_repo\",\"source\":\"local\",\"display_name\":\"EMA 0.0.5 runtime\",\"source_ref\":{\"kind\":\"local_path\",\"path\":\"/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24\"},\"codebase_id\":\"codebase:01J00000000000000000000011\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000111"/utf8>>,
            <<"attachment.linked"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:some(
                <<"project:01J00000000000000000000006"/utf8>>
            ),
            <<"{\"attachment_id\":\"attachment:01J00000000000000000000010\",\"object_kind\":\"blueprint_section\",\"object_id\":\"blueprint_sec:01J00000000000000000000009\"}"/utf8>>
        ),
        envelope(
            <<"event:01J00000000000000000000112"/utf8>>,
            <<"blueprint.attachment.linked"/utf8>>,
            ema_daemon@event_envelope:some(
                <<"space:01J00000000000000000000005"/utf8>>
            ),
            ema_daemon@event_envelope:some(
                <<"project:01J00000000000000000000006"/utf8>>
            ),
            <<"{\"attachment_id\":\"attachment:01J00000000000000000000010\",\"section_id\":\"blueprint_sec:01J00000000000000000000009\"}"/utf8>>
        )].
