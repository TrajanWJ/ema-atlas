-module(ema_shell_ipc@ema_shell_ipc).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_shell_ipc/ema_shell_ipc.gleam").
-export([start/3]).
-export_type([conn_state/0, ws_custom/0, incoming/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Localhost WebSocket IPC server.\n"
    "\n"
    " M1 scope: implements the v0 handshake, ping/pong, a single\n"
    " `debug.ping` command that round-trips through the bus, and the\n"
    " subscribe->event stream. The wire format matches\n"
    " `packages/contracts/ipc/shell-protocol.md`.\n"
).

-type conn_state() :: {conn_state,
        gleam@erlang@process:subject(ema_daemon@bus:delivery()),
        gleam@erlang@process:subject(ema_daemon@bus:msg()),
        boolean()}.

-type ws_custom() :: {bus_delivery, ema_daemon@bus:delivery()}.

-type incoming() :: {incoming,
        binary(),
        binary(),
        gleam@option:option(binary()),
        gleam@option:option(binary()),
        gleam@option:option(binary())}.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 410).
-spec projection_message(binary(), binary()) -> binary().
projection_message(Name, Data_json) ->
    <<<<<<<<"{\"v\":0,\"type\":\"projection\",\"name\":\""/utf8, Name/binary>>/binary,
                "\",\"data\":"/utf8>>/binary,
            Data_json/binary>>/binary,
        "}"/utf8>>.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 418).
-spec send_projection(
    mist@internal@websocket:websocket_connection(),
    binary(),
    binary()
) -> nil.
send_projection(Conn, Name, Data_json) ->
    _ = mist:send_text_frame(Conn, projection_message(Name, Data_json)),
    nil.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 389).
-spec event_message(integer(), ema_daemon@event_envelope:envelope()) -> binary().
event_message(_, Env) ->
    gleam@json:to_string(
        gleam@json:object(
            [{<<"v"/utf8>>, gleam@json:int(0)},
                {<<"type"/utf8>>, gleam@json:string(<<"event"/utf8>>)},
                {<<"channel"/utf8>>, gleam@json:string(<<"events"/utf8>>)},
                {<<"event"/utf8>>,
                    gleam@json:object(
                        [{<<"event_id"/utf8>>,
                                gleam@json:string(erlang:element(2, Env))},
                            {<<"kind"/utf8>>,
                                gleam@json:string(erlang:element(3, Env))},
                            {<<"ts"/utf8>>,
                                gleam@json:string(erlang:element(4, Env))},
                            {<<"actor"/utf8>>,
                                gleam@json:string(erlang:element(5, Env))},
                            {<<"org_id"/utf8>>,
                                gleam@json:string(erlang:element(6, Env))},
                            {<<"payload_json"/utf8>>,
                                gleam@json:string(erlang:element(11, Env))}]
                    )}]
        )
    ).

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 118).
-spec handle_bus_delivery(
    conn_state(),
    ema_daemon@bus:delivery(),
    mist@internal@websocket:websocket_connection()
) -> mist:next(conn_state(), ws_custom()).
handle_bus_delivery(State, Delivery, Conn) ->
    case Delivery of
        {event, Txid, Env} ->
            Payload = event_message(Txid, Env),
            _ = mist:send_text_frame(Conn, Payload),
            _ = send_projection(
                Conn,
                <<"event_trail"/utf8>>,
                ema_daemon@bus:event_trail_projection_json(
                    erlang:element(3, State)
                )
            ),
            case erlang:element(3, Env) of
                <<"org.created"/utf8>> ->
                    send_projection(
                        Conn,
                        <<"topbar"/utf8>>,
                        ema_daemon@bus:topbar_projection_json(
                            erlang:element(3, State)
                        )
                    );

                _ ->
                    nil
            end,
            mist:continue(State);

        {subscription_dropped, Reason} ->
            Payload@1 = gleam@json:to_string(
                gleam@json:object(
                    [{<<"v"/utf8>>, gleam@json:int(0)},
                        {<<"type"/utf8>>,
                            gleam@json:string(<<"subscription_dropped"/utf8>>)},
                        {<<"channel"/utf8>>,
                            gleam@json:string(<<"events"/utf8>>)},
                        {<<"reason"/utf8>>, gleam@json:string(Reason)}]
                )
            ),
            _ = mist:send_text_frame(Conn, Payload@1),
            mist:continue(
                {conn_state,
                    erlang:element(2, State),
                    erlang:element(3, State),
                    false}
            )
    end.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 371).
-spec err(binary(), binary(), binary()) -> binary().
err(In_reply_to, Class, Message) ->
    gleam@json:to_string(
        gleam@json:object(
            [{<<"v"/utf8>>, gleam@json:int(0)},
                {<<"type"/utf8>>, gleam@json:string(<<"command_result"/utf8>>)},
                {<<"in_reply_to"/utf8>>, gleam@json:string(In_reply_to)},
                {<<"ok"/utf8>>, gleam@json:bool(false)},
                {<<"error"/utf8>>,
                    gleam@json:object(
                        [{<<"class"/utf8>>, gleam@json:string(Class)},
                            {<<"message"/utf8>>, gleam@json:string(Message)}]
                    )}]
        )
    ).

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 427).
-spec send_projection_snapshot(
    mist@internal@websocket:websocket_connection(),
    gleam@erlang@process:subject(ema_daemon@bus:msg()),
    gleam@option:option(binary())
) -> nil.
send_projection_snapshot(Conn, Bus_subj, Channel) ->
    case Channel of
        {some, <<"topbar"/utf8>>} ->
            send_projection(
                Conn,
                <<"topbar"/utf8>>,
                ema_daemon@bus:topbar_projection_json(Bus_subj)
            );

        {some, <<"event_trail"/utf8>>} ->
            send_projection(
                Conn,
                <<"event_trail"/utf8>>,
                ema_daemon@bus:event_trail_projection_json(Bus_subj)
            );

        {some, Ch} ->
            case gleam_stdlib:contains_string(Ch, <<".orgs"/utf8>>) of
                true ->
                    send_projection(
                        Conn,
                        <<"topbar"/utf8>>,
                        ema_daemon@bus:topbar_projection_json(Bus_subj)
                    );

                false ->
                    nil
            end;

        _ ->
            nil
    end.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 359).
-spec command_ok(binary(), list(binary())) -> binary().
command_ok(In_reply_to, Event_ids) ->
    gleam@json:to_string(
        gleam@json:object(
            [{<<"v"/utf8>>, gleam@json:int(0)},
                {<<"type"/utf8>>, gleam@json:string(<<"command_result"/utf8>>)},
                {<<"in_reply_to"/utf8>>, gleam@json:string(In_reply_to)},
                {<<"ok"/utf8>>, gleam@json:bool(true)},
                {<<"events"/utf8>>,
                    gleam@json:preprocessed_array(
                        gleam@list:map(Event_ids, fun gleam@json:string/1)
                    )}]
        )
    ).

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 456).
-spec run_debug_ping(gleam@erlang@process:subject(ema_daemon@bus:msg())) -> list(binary()).
run_debug_ping(Bus_subj) ->
    Now = ema_time_ffi:iso_now(),
    Dispatch_id = <<"dispatch:debug-"/utf8, Now/binary>>,
    Started = {envelope,
        <<<<"event:"/utf8, Now/binary>>/binary, "-dbg-start"/utf8>>,
        <<"dispatch.started"/utf8>>,
        Now,
        <<"actor:dev-console"/utf8>>,
        <<"org:dev"/utf8>>,
        ema_daemon@event_envelope:none(),
        ema_daemon@event_envelope:none(),
        ema_daemon@event_envelope:some(Dispatch_id),
        ema_daemon@event_envelope:none(),
        <<"{\"source\":\"debug.ping\"}"/utf8>>},
    Ended = {envelope,
        <<<<"event:"/utf8, Now/binary>>/binary, "-dbg-end"/utf8>>,
        <<"dispatch.ended"/utf8>>,
        Now,
        <<"actor:dev-console"/utf8>>,
        <<"org:dev"/utf8>>,
        ema_daemon@event_envelope:none(),
        ema_daemon@event_envelope:none(),
        ema_daemon@event_envelope:some(Dispatch_id),
        ema_daemon@event_envelope:none(),
        <<"{\"source\":\"debug.ping\"}"/utf8>>},
    _pipe = [Started, Ended],
    gleam@list:filter_map(
        _pipe,
        fun(E) -> case ema_daemon@bus:append(Bus_subj, E) of
                {ok, _} ->
                    {ok, erlang:element(2, E)};

                {error, _} ->
                    {error, nil}
            end end
    ).

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 349).
-spec pong(binary()) -> binary().
pong(In_reply_to) ->
    gleam@json:to_string(
        gleam@json:object(
            [{<<"v"/utf8>>, gleam@json:int(0)},
                {<<"type"/utf8>>, gleam@json:string(<<"pong"/utf8>>)},
                {<<"in_reply_to"/utf8>>, gleam@json:string(In_reply_to)}]
        )
    ).

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 336).
-spec hello_ack() -> binary().
hello_ack() ->
    gleam@json:to_string(
        gleam@json:object(
            [{<<"v"/utf8>>, gleam@json:int(0)},
                {<<"type"/utf8>>, gleam@json:string(<<"hello"/utf8>>)},
                {<<"id"/utf8>>, gleam@json:string(<<"msg-hello-daemon"/utf8>>)},
                {<<"daemon_version"/utf8>>,
                    gleam@json:string(<<"0.0.5-dev"/utf8>>)},
                {<<"accepted_device_id"/utf8>>,
                    gleam@json:string(<<"device:dev-local"/utf8>>)},
                {<<"note"/utf8>>, gleam@json:null()}]
        )
    ).

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 302).
-spec decode_envelope(binary()) -> {ok, incoming()} | {error, binary()}.
decode_envelope(Raw) ->
    Decoder = begin
        gleam@dynamic@decode:field(
            <<"id"/utf8>>,
            {decoder, fun gleam@dynamic@decode:decode_string/1},
            fun(Id) ->
                gleam@dynamic@decode:field(
                    <<"type"/utf8>>,
                    {decoder, fun gleam@dynamic@decode:decode_string/1},
                    fun(Kind) ->
                        gleam@dynamic@decode:optional_field(
                            <<"op"/utf8>>,
                            none,
                            gleam@dynamic@decode:optional(
                                {decoder,
                                    fun gleam@dynamic@decode:decode_string/1}
                            ),
                            fun(Op) ->
                                gleam@dynamic@decode:optional_field(
                                    <<"channel"/utf8>>,
                                    none,
                                    gleam@dynamic@decode:optional(
                                        {decoder,
                                            fun gleam@dynamic@decode:decode_string/1}
                                    ),
                                    fun(Channel) ->
                                        gleam@dynamic@decode:optional_field(
                                            <<"args"/utf8>>,
                                            none,
                                            gleam@dynamic@decode:optional(
                                                gleam@dynamic@decode:at(
                                                    [<<"name"/utf8>>],
                                                    {decoder,
                                                        fun gleam@dynamic@decode:decode_string/1}
                                                )
                                            ),
                                            fun(Name) ->
                                                gleam@dynamic@decode:success(
                                                    {incoming,
                                                        Id,
                                                        Kind,
                                                        Op,
                                                        Channel,
                                                        Name}
                                                )
                                            end
                                        )
                                    end
                                )
                            end
                        )
                    end
                )
            end
        )
    end,
    case gleam@json:parse(Raw, Decoder) of
        {ok, Env} ->
            {ok, Env};

        {error, _} ->
            {error, <<"decode failed"/utf8>>}
    end.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 164).
-spec handle_text(
    conn_state(),
    binary(),
    mist@internal@websocket:websocket_connection(),
    gleam@erlang@process:subject(ema_daemon@bus:msg())
) -> mist:next(conn_state(), ws_custom()).
handle_text(State, Text, Conn, Bus_subj) ->
    case decode_envelope(Text) of
        {error, _} ->
            _ = mist:send_text_frame(
                Conn,
                err(<<""/utf8>>, <<"invalid_args"/utf8>>, <<"bad json"/utf8>>)
            ),
            mist:continue(State);

        {ok, Incoming} ->
            case erlang:element(3, Incoming) of
                <<"hello"/utf8>> ->
                    _ = mist:send_text_frame(Conn, hello_ack()),
                    mist:continue(State);

                <<"ping"/utf8>> ->
                    _ = mist:send_text_frame(
                        Conn,
                        pong(erlang:element(2, Incoming))
                    ),
                    mist:continue(State);

                <<"subscribe"/utf8>> ->
                    _ = send_projection_snapshot(
                        Conn,
                        Bus_subj,
                        erlang:element(5, Incoming)
                    ),
                    gleam@erlang@process:send(
                        Bus_subj,
                        {subscribe,
                            erlang:element(2, State),
                            none,
                            gleam@erlang@process:new_subject()}
                    ),
                    mist:continue(
                        {conn_state,
                            erlang:element(2, State),
                            erlang:element(3, State),
                            true}
                    );

                <<"unsubscribe"/utf8>> ->
                    gleam@erlang@process:send(
                        Bus_subj,
                        {unsubscribe,
                            erlang:element(2, State),
                            gleam@erlang@process:new_subject()}
                    ),
                    mist:continue(
                        {conn_state,
                            erlang:element(2, State),
                            erlang:element(3, State),
                            false}
                    );

                <<"command"/utf8>> ->
                    case erlang:element(4, Incoming) of
                        {some, <<"debug.ping"/utf8>>} ->
                            Events = run_debug_ping(Bus_subj),
                            _ = mist:send_text_frame(
                                Conn,
                                command_ok(erlang:element(2, Incoming), Events)
                            ),
                            mist:continue(State);

                        {some, <<"org.create"/utf8>>} ->
                            case erlang:element(6, Incoming) of
                                {some, Name} ->
                                    case ema_orgs@ema_orgs:create(
                                        Bus_subj,
                                        Name
                                    ) of
                                        {ok, Event_id} ->
                                            _ = mist:send_text_frame(
                                                Conn,
                                                command_ok(
                                                    erlang:element(2, Incoming),
                                                    [Event_id]
                                                )
                                            ),
                                            _ = send_projection_snapshot(
                                                Conn,
                                                Bus_subj,
                                                {some, <<"topbar"/utf8>>}
                                            ),
                                            _ = send_projection_snapshot(
                                                Conn,
                                                Bus_subj,
                                                {some, <<"event_trail"/utf8>>}
                                            ),
                                            mist:continue(State);

                                        {error, empty_name} ->
                                            _ = mist:send_text_frame(
                                                Conn,
                                                err(
                                                    erlang:element(2, Incoming),
                                                    <<"invalid_args"/utf8>>,
                                                    <<"org name is required"/utf8>>
                                                )
                                            ),
                                            mist:continue(State);

                                        {error, {append_failed, Reason}} ->
                                            _ = mist:send_text_frame(
                                                Conn,
                                                err(
                                                    erlang:element(2, Incoming),
                                                    <<"internal"/utf8>>,
                                                    Reason
                                                )
                                            ),
                                            mist:continue(State)
                                    end;

                                none ->
                                    _ = mist:send_text_frame(
                                        Conn,
                                        err(
                                            erlang:element(2, Incoming),
                                            <<"invalid_args"/utf8>>,
                                            <<"missing args.name"/utf8>>
                                        )
                                    ),
                                    mist:continue(State)
                            end;

                        {some, Op} ->
                            _ = mist:send_text_frame(
                                Conn,
                                err(
                                    erlang:element(2, Incoming),
                                    <<"unknown_op"/utf8>>,
                                    <<"no handler for "/utf8, Op/binary>>
                                )
                            ),
                            mist:continue(State);

                        none ->
                            _ = mist:send_text_frame(
                                Conn,
                                err(
                                    erlang:element(2, Incoming),
                                    <<"invalid_args"/utf8>>,
                                    <<"missing op"/utf8>>
                                )
                            ),
                            mist:continue(State)
                    end;

                Other ->
                    _ = mist:send_text_frame(
                        Conn,
                        err(
                            erlang:element(2, Incoming),
                            <<"unknown_op"/utf8>>,
                            <<"unknown type "/utf8, Other/binary>>
                        )
                    ),
                    mist:continue(State)
            end
    end.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 102).
-spec handle_ws(
    conn_state(),
    mist:websocket_message(ws_custom()),
    mist@internal@websocket:websocket_connection(),
    gleam@erlang@process:subject(ema_daemon@bus:msg())
) -> mist:next(conn_state(), ws_custom()).
handle_ws(State, Msg, Conn, Bus_subj) ->
    case Msg of
        {text, Text} ->
            handle_text(State, Text, Conn, Bus_subj);

        {binary, _} ->
            mist:continue(State);

        closed ->
            mist:stop();

        shutdown ->
            mist:stop();

        {custom, {bus_delivery, Delivery}} ->
            handle_bus_delivery(State, Delivery, Conn)
    end.

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 50).
-spec route(
    gleam@http@request:request(mist@internal@http:connection()),
    gleam@erlang@process:subject(ema_daemon@bus:msg())
) -> gleam@http@response:response(mist:response_data()).
route(Req, Bus_subj) ->
    mist:websocket(
        Req,
        fun(State, Msg, Conn) -> handle_ws(State, Msg, Conn, Bus_subj) end,
        fun(_) ->
            Bus_delivery = gleam@erlang@process:new_subject(),
            Selector = begin
                _pipe = gleam_erlang_ffi:new_selector(),
                gleam@erlang@process:select_map(
                    _pipe,
                    Bus_delivery,
                    fun(Field@0) -> {bus_delivery, Field@0} end
                )
            end,
            {{conn_state, Bus_delivery, Bus_subj, false}, {some, Selector}}
        end,
        fun(State@1) -> case erlang:element(4, State@1) of
                true ->
                    gleam@erlang@process:send(
                        Bus_subj,
                        {unsubscribe,
                            erlang:element(2, State@1),
                            gleam@erlang@process:new_subject()}
                    ),
                    nil;

                false ->
                    nil
            end end
    ).

-file("src/ema_shell_ipc/ema_shell_ipc.gleam", 25).
-spec start(
    gleam@erlang@process:subject(ema_daemon@bus:msg()),
    binary(),
    integer()
) -> {ok, nil} | {error, binary()}.
start(Bus_subj, Bind, Port) ->
    Handler = fun(Req) -> route(Req, Bus_subj) end,
    case begin
        _pipe = mist:new(Handler),
        _pipe@1 = mist:bind(_pipe, Bind),
        _pipe@2 = mist:port(_pipe@1, Port),
        mist:start(_pipe@2)
    end of
        {ok, _} ->
            {ok, nil};

        {error, _} ->
            {error,
                <<<<<<"mist failed to bind "/utf8, Bind/binary>>/binary,
                        ":"/utf8>>/binary,
                    (erlang:integer_to_binary(Port))/binary>>}
    end.
