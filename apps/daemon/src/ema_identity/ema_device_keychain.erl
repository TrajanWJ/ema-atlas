%% Device-key helpers for EMA machine identity.
%%
%% The canonical event log stores public keys only. Private device keys are
%% written to the local platform secret store and referenced by secret_ref.

-module(ema_device_keychain).
-export([
    generate_ed25519_keypair/0,
    store_macos_device_private_key/3,
    sign_lineage_proof_with_private_key/5,
    sign_macos_lineage_proof/5
]).

generate_ed25519_keypair() ->
    try
        application:ensure_all_started(crypto),
        {Public, Private} = crypto:generate_key(eddsa, ed25519),
        {ok, {device_key_pair, prefixed_hex(<<"ed25519">>, Public), prefixed_hex(<<"ed25519-secret">>, Private)}}
    catch
        Class:Reason ->
            {error, inspect_reason({Class, Reason})}
    end.

store_macos_device_private_key(SecretRef, DeviceId, PrivateKey) ->
    case os:type() of
        {unix, darwin} ->
            run_security([
                <<"add-generic-password">>,
                <<"-s">>, <<"com.ema.device-key">>,
                <<"-a">>, to_binary(DeviceId),
                <<"-l">>, to_binary(SecretRef),
                <<"-w">>, to_binary(PrivateKey),
                <<"-U">>
            ]);
        Other ->
            {error, inspect_reason({unsupported_secret_store, Other})}
    end.

sign_macos_lineage_proof(DeviceId, PeerPubkey, LocalPubkey, OrgId, CeremonyId) ->
    case os:type() of
        {unix, darwin} ->
            case read_macos_device_private_key(DeviceId) of
                {ok, PrivateKey} ->
                    sign_lineage_proof_with_private_key(PrivateKey, PeerPubkey, LocalPubkey, OrgId, CeremonyId);
                Error -> Error
            end;
        Other ->
            {error, inspect_reason({unsupported_secret_store, Other})}
    end.

sign_lineage_proof_with_private_key(PrivateKey, PeerPubkey, LocalPubkey, OrgId, CeremonyId) ->
    try
        application:ensure_all_started(crypto),
        PrivateBytes = decode_prefixed_hex(<<"ed25519-secret">>, PrivateKey),
        Message = lineage_message(PeerPubkey, LocalPubkey, OrgId, CeremonyId),
        Signature = crypto:sign(eddsa, none, Message, [PrivateBytes, ed25519]),
        {ok, prefixed_hex(<<"ed25519-signature">>, Signature)}
    catch
        Class:Reason ->
            {error, inspect_reason({Class, Reason})}
    end.

read_macos_device_private_key(DeviceId) ->
    run_security_capture([
        <<"find-generic-password">>,
        <<"-s">>, <<"com.ema.device-key">>,
        <<"-a">>, to_binary(DeviceId),
        <<"-w">>
    ]).

run_security(Args) ->
    Port = open_port(
        {spawn_executable, "/usr/bin/security"},
        [exit_status, stderr_to_stdout, {args, [binary_to_list(A) || A <- Args]}]
    ),
    collect_port(Port, []).

collect_port(Port, Acc) ->
    receive
        {Port, {data, Data}} ->
            collect_port(Port, [Data | Acc]);
        {Port, {exit_status, 0}} ->
            {ok, nil};
        {Port, {exit_status, Status}} ->
            Output = iolist_to_binary(lists:reverse(Acc)),
            {error, inspect_reason({security_exit, Status, Output})}
    after 5000 ->
        port_close(Port),
        {error, <<"security command timed out">>}
    end.

run_security_capture(Args) ->
    Port = open_port(
        {spawn_executable, "/usr/bin/security"},
        [exit_status, stderr_to_stdout, {args, [binary_to_list(A) || A <- Args]}]
    ),
    collect_port_capture(Port, []).

collect_port_capture(Port, Acc) ->
    receive
        {Port, {data, Data}} ->
            collect_port_capture(Port, [Data | Acc]);
        {Port, {exit_status, 0}} ->
            {ok, trim_trailing_newline(iolist_to_binary(lists:reverse(Acc)))};
        {Port, {exit_status, Status}} ->
            Output = iolist_to_binary(lists:reverse(Acc)),
            {error, inspect_reason({security_exit, Status, Output})}
    after 5000 ->
        port_close(Port),
        {error, <<"security command timed out">>}
    end.

prefixed_hex(Prefix, Bytes) ->
    <<Prefix/binary, ":", (binary:encode_hex(Bytes, lowercase))/binary>>.

decode_prefixed_hex(Prefix, Value) ->
    Binary = to_binary(Value),
    Expected = <<Prefix/binary, ":">>,
    case binary:split(Binary, Expected) of
        [<<>>, Hex] -> binary:decode_hex(Hex);
        _ -> error({bad_key_prefix, Prefix})
    end.

lineage_message(PeerPubkey, LocalPubkey, OrgId, CeremonyId) ->
    iolist_to_binary([
        to_binary(PeerPubkey), <<"\n">>,
        to_binary(LocalPubkey), <<"\n">>,
        to_binary(OrgId), <<"\n">>,
        to_binary(CeremonyId)
    ]).

trim_trailing_newline(Value) ->
    binary:replace(binary:replace(Value, <<"\n">>, <<>>, [global]), <<"\r">>, <<>>, [global]).

to_binary(V) when is_binary(V) -> V;
to_binary(V) when is_list(V) -> iolist_to_binary(V).

inspect_reason(Reason) when is_binary(Reason) ->
    Reason;
inspect_reason(Reason) when is_atom(Reason) ->
    atom_to_binary(Reason, utf8);
inspect_reason(Reason) ->
    iolist_to_binary(io_lib:format("~p", [Reason])).
