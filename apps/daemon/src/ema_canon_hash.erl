-module(ema_canon_hash).
-export([sha256/1]).

sha256(Value) ->
    Bytes = crypto:hash(sha256, to_binary(Value)),
    iolist_to_binary([io_lib:format("~2.16.0b", [Byte]) || <<Byte>> <= Bytes]).

to_binary(Value) when is_binary(Value) -> Value;
to_binary(Value) when is_list(Value) -> unicode:characters_to_binary(Value);
to_binary(Value) -> unicode:characters_to_binary(io_lib:format("~p", [Value])).
