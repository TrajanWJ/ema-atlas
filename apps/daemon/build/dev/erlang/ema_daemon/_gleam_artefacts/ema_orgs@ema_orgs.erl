-module(ema_orgs@ema_orgs).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_orgs/ema_orgs.gleam").
-export([create/2]).
-export_type([create_error/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " ema_orgs — organizations.\n"
    "\n"
    " First vertical slice: handle `org.create` by producing one canonical\n"
    " `org.created` event and appending it through the daemon bus.\n"
).

-type create_error() :: empty_name | {append_failed, binary()}.

-file("src/ema_orgs/ema_orgs.gleam", 70).
-spec describe_append_error(ema_daemon@bus:append_error()) -> binary().
describe_append_error(E) ->
    case E of
        {invalid_kind, Kind} ->
            <<"invalid event kind: "/utf8, Kind/binary>>;

        {not_in_catalog, Kind@1} ->
            <<"event kind not in catalog: "/utf8, Kind@1/binary>>;

        {persistence_failed, Reason} ->
            <<"persistence failed: "/utf8, Reason/binary>>
    end.

-file("src/ema_orgs/ema_orgs.gleam", 61).
-spec id_suffix(binary()) -> binary().
id_suffix(Now) ->
    _pipe = Now,
    _pipe@1 = gleam@string:replace(_pipe, <<"-"/utf8>>, <<""/utf8>>),
    _pipe@2 = gleam@string:replace(_pipe@1, <<":"/utf8>>, <<""/utf8>>),
    _pipe@3 = gleam@string:replace(_pipe@2, <<"."/utf8>>, <<""/utf8>>),
    _pipe@4 = gleam@string:replace(_pipe@3, <<"T"/utf8>>, <<""/utf8>>),
    gleam@string:replace(_pipe@4, <<"Z"/utf8>>, <<""/utf8>>).

-file("src/ema_orgs/ema_orgs.gleam", 17).
-spec create(gleam@erlang@process:subject(ema_daemon@bus:msg()), binary()) -> {ok,
        binary()} |
    {error, create_error()}.
create(Bus_subject, Name) ->
    Clean_name = gleam@string:trim(Name),
    case Clean_name of
        <<""/utf8>> ->
            {error, empty_name};

        _ ->
            Now = ema_time_ffi:iso_now(),
            Suffix = id_suffix(Now),
            Org_id = <<"org:"/utf8, Suffix/binary>>,
            Event_id = <<<<"event:"/utf8, Suffix/binary>>/binary,
                "-org-created"/utf8>>,
            Payload = gleam@json:to_string(
                gleam@json:object(
                    [{<<"id"/utf8>>, gleam@json:string(Org_id)},
                        {<<"name"/utf8>>, gleam@json:string(Clean_name)},
                        {<<"created_by"/utf8>>,
                            gleam@json:string(<<"actor:dev-console"/utf8>>)}]
                )
            ),
            Env = {envelope,
                Event_id,
                <<"org.created"/utf8>>,
                Now,
                <<"actor:dev-console"/utf8>>,
                Org_id,
                ema_daemon@event_envelope:none(),
                ema_daemon@event_envelope:none(),
                ema_daemon@event_envelope:none(),
                ema_daemon@event_envelope:none(),
                Payload},
            case ema_daemon@bus:append(Bus_subject, Env) of
                {ok, _} ->
                    {ok, Event_id};

                {error, E} ->
                    {error, {append_failed, describe_append_error(E)}}
            end
    end.
