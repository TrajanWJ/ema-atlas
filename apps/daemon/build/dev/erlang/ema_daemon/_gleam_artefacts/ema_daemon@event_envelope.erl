-module(ema_daemon@event_envelope).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_daemon/event_envelope.gleam").
-export([some/1, none/0, kind_in_catalog/1, validate/1]).
-export_type([option/1, envelope/0, validation_error/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Canonical event envelope helpers.\n"
    "\n"
    " The daemon is the only canonical writer. Every bounded-context writer\n"
    " should emit one of these envelopes, then append it through the bus.\n"
).

-type option(AQW) :: none | {some, AQW}.

-type envelope() :: {envelope,
        binary(),
        binary(),
        binary(),
        binary(),
        binary(),
        option(binary()),
        option(binary()),
        option(binary()),
        option(binary()),
        binary()}.

-type validation_error() :: empty_event_id |
    empty_kind |
    empty_timestamp |
    empty_actor |
    empty_org |
    empty_payload |
    {not_in_catalog, binary()}.

-file("src/ema_daemon/event_envelope.gleam", 36).
-spec some(AQX) -> option(AQX).
some(Value) ->
    {some, Value}.

-file("src/ema_daemon/event_envelope.gleam", 40).
-spec none() -> option(any()).
none() ->
    none.

-file("src/ema_daemon/event_envelope.gleam", 86).
-spec validate_payload(envelope()) -> {ok, nil} | {error, validation_error()}.
validate_payload(Env) ->
    case erlang:element(11, Env) =:= <<""/utf8>> of
        true ->
            {error, empty_payload};

        false ->
            {ok, nil}
    end.

-file("src/ema_daemon/event_envelope.gleam", 79).
-spec validate_org(envelope()) -> {ok, nil} | {error, validation_error()}.
validate_org(Env) ->
    case erlang:element(6, Env) =:= <<""/utf8>> of
        true ->
            {error, empty_org};

        false ->
            validate_payload(Env)
    end.

-file("src/ema_daemon/event_envelope.gleam", 72).
-spec validate_actor(envelope()) -> {ok, nil} | {error, validation_error()}.
validate_actor(Env) ->
    case erlang:element(5, Env) =:= <<""/utf8>> of
        true ->
            {error, empty_actor};

        false ->
            validate_org(Env)
    end.

-file("src/ema_daemon/event_envelope.gleam", 65).
-spec validate_ts(envelope()) -> {ok, nil} | {error, validation_error()}.
validate_ts(Env) ->
    case erlang:element(4, Env) =:= <<""/utf8>> of
        true ->
            {error, empty_timestamp};

        false ->
            validate_actor(Env)
    end.

-file("src/ema_daemon/event_envelope.gleam", 93).
-spec kind_in_catalog(binary()) -> boolean().
kind_in_catalog(Kind) ->
    case Kind of
        <<"actor.created"/utf8>> ->
            true;

        <<"actor.assigned_to_project"/utf8>> ->
            true;

        <<"org.created"/utf8>> ->
            true;

        <<"org.renamed"/utf8>> ->
            true;

        <<"org.settings_updated"/utf8>> ->
            true;

        <<"org.archived"/utf8>> ->
            true;

        <<"space.created"/utf8>> ->
            true;

        <<"space.renamed"/utf8>> ->
            true;

        <<"space.settings_updated"/utf8>> ->
            true;

        <<"space.archived"/utf8>> ->
            true;

        <<"space.member_added"/utf8>> ->
            true;

        <<"space.member_removed"/utf8>> ->
            true;

        <<"project.created"/utf8>> ->
            true;

        <<"project.renamed"/utf8>> ->
            true;

        <<"project.archived"/utf8>> ->
            true;

        <<"project.moved"/utf8>> ->
            true;

        <<"membership.role_granted"/utf8>> ->
            true;

        <<"membership.role_revoked"/utf8>> ->
            true;

        <<"membership.removed"/utf8>> ->
            true;

        <<"invite.created"/utf8>> ->
            true;

        <<"invite.accepted"/utf8>> ->
            true;

        <<"invite.revoked"/utf8>> ->
            true;

        <<"invite.expired"/utf8>> ->
            true;

        <<"device.registered"/utf8>> ->
            true;

        <<"device.renamed"/utf8>> ->
            true;

        <<"device.revoked"/utf8>> ->
            true;

        <<"device.key_rotated"/utf8>> ->
            true;

        <<"peer.seen"/utf8>> ->
            true;

        <<"peer.unreachable"/utf8>> ->
            true;

        <<"lease.issued"/utf8>> ->
            true;

        <<"lease.renewed"/utf8>> ->
            true;

        <<"lease.released"/utf8>> ->
            true;

        <<"lease.expired"/utf8>> ->
            true;

        <<"lease.superseded"/utf8>> ->
            true;

        <<"replication.batch_sent"/utf8>> ->
            true;

        <<"replication.batch_applied"/utf8>> ->
            true;

        <<"replication.diverged"/utf8>> ->
            true;

        <<"replication.resynced"/utf8>> ->
            true;

        <<"lane.opened"/utf8>> ->
            true;

        <<"lane.closed"/utf8>> ->
            true;

        <<"lane.item_added"/utf8>> ->
            true;

        <<"lane.item_moved"/utf8>> ->
            true;

        <<"handoff.requested"/utf8>> ->
            true;

        <<"handoff.accepted"/utf8>> ->
            true;

        <<"handoff.rejected"/utf8>> ->
            true;

        <<"handoff.completed"/utf8>> ->
            true;

        <<"proposal.drafted"/utf8>> ->
            true;

        <<"proposal.submitted"/utf8>> ->
            true;

        <<"proposal.accepted"/utf8>> ->
            true;

        <<"proposal.rejected"/utf8>> ->
            true;

        <<"proposal.superseded"/utf8>> ->
            true;

        <<"incident.opened"/utf8>> ->
            true;

        <<"incident.noted"/utf8>> ->
            true;

        <<"incident.resolved"/utf8>> ->
            true;

        <<"dispatch.started"/utf8>> ->
            true;

        <<"dispatch.scope_granted"/utf8>> ->
            true;

        <<"dispatch.ended"/utf8>> ->
            true;

        <<"execution.started"/utf8>> ->
            true;

        <<"execution.ended"/utf8>> ->
            true;

        <<"execution.failed"/utf8>> ->
            true;

        <<"tool.invoked"/utf8>> ->
            true;

        <<"tool.returned"/utf8>> ->
            true;

        <<"tool.errored"/utf8>> ->
            true;

        <<"blueprint.document.created"/utf8>> ->
            true;

        <<"blueprint.document.renamed"/utf8>> ->
            true;

        <<"blueprint.document.archived"/utf8>> ->
            true;

        <<"blueprint.section.added"/utf8>> ->
            true;

        <<"blueprint.section.renamed"/utf8>> ->
            true;

        <<"blueprint.section.moved"/utf8>> ->
            true;

        <<"blueprint.section.removed"/utf8>> ->
            true;

        <<"blueprint.section.promoted_to_proposal"/utf8>> ->
            true;

        <<"blueprint.comment.added"/utf8>> ->
            true;

        <<"blueprint.comment.resolved"/utf8>> ->
            true;

        <<"blueprint.attachment.linked"/utf8>> ->
            true;

        <<"blueprint.attachment.unlinked"/utf8>> ->
            true;

        <<"attachment.created"/utf8>> ->
            true;

        <<"attachment.renamed"/utf8>> ->
            true;

        <<"attachment.deleted"/utf8>> ->
            true;

        <<"attachment.linked"/utf8>> ->
            true;

        <<"attachment.unlinked"/utf8>> ->
            true;

        <<"connector.connected"/utf8>> ->
            true;

        <<"connector.disconnected"/utf8>> ->
            true;

        <<"connector.linked_resource_imported"/utf8>> ->
            true;

        _ ->
            false
    end.

-file("src/ema_daemon/event_envelope.gleam", 58).
-spec validate_catalog(envelope()) -> {ok, nil} | {error, validation_error()}.
validate_catalog(Env) ->
    case kind_in_catalog(erlang:element(3, Env)) of
        false ->
            {error, {not_in_catalog, erlang:element(3, Env)}};

        true ->
            validate_ts(Env)
    end.

-file("src/ema_daemon/event_envelope.gleam", 51).
-spec validate_kind(envelope()) -> {ok, nil} | {error, validation_error()}.
validate_kind(Env) ->
    case erlang:element(3, Env) =:= <<""/utf8>> of
        true ->
            {error, empty_kind};

        false ->
            validate_catalog(Env)
    end.

-file("src/ema_daemon/event_envelope.gleam", 44).
-spec validate(envelope()) -> {ok, nil} | {error, validation_error()}.
validate(Env) ->
    case erlang:element(2, Env) =:= <<""/utf8>> of
        true ->
            {error, empty_event_id};

        false ->
            validate_kind(Env)
    end.
