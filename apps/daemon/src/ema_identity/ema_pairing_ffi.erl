-module(ema_pairing_ffi).
-export([random_digits/1]).

random_digits(Length) when is_integer(Length), Length > 0 ->
    Max = pow10(Length),
    <<Raw:64>> = crypto:strong_rand_bytes(8),
    Number = Raw rem Max,
    unicode:characters_to_binary(io_lib:format("~*..0B", [Length, Number])).

pow10(Length) ->
    pow10(Length, 1).

pow10(0, Acc) ->
    Acc;
pow10(Length, Acc) ->
    pow10(Length - 1, Acc * 10).
