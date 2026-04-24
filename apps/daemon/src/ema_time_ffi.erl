-module(ema_time_ffi).
-export([iso_now/0, ulid/0]).

iso_now() ->
    {{Y, Mo, D}, {H, Mi, S}} = calendar:universal_time(),
    Iso = io_lib:format(
        "~4..0B-~2..0B-~2..0BT~2..0B:~2..0B:~2..0BZ",
        [Y, Mo, D, H, Mi, S]
    ),
    unicode:characters_to_binary(Iso).

ulid() ->
    NowMs = erlang:system_time(millisecond),
    Counter = erlang:unique_integer([positive, monotonic]),
    Random = crypto:strong_rand_bytes(8),
    <<Rand:64>> = Random,
    Value = (NowMs bsl 80) bor ((Counter band ((1 bsl 16) - 1)) bsl 64) bor Rand,
    Encoded = encode_crockford(Value, 26, []),
    unicode:characters_to_binary(Encoded).

encode_crockford(_Value, 0, Acc) ->
    Acc;
encode_crockford(Value, Remaining, Acc) ->
    Digit = Value band 31,
    encode_crockford(Value bsr 5, Remaining - 1, [crockford_digit(Digit) | Acc]).

crockford_digit(N) when N < 10 ->
    $0 + N;
crockford_digit(N) ->
    lists:nth(N - 9, "ABCDEFGHJKMNPQRSTVWXYZ").
