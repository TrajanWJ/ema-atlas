-module(ema_time_ffi).
-export([iso_now/0]).

iso_now() ->
    {{Y, Mo, D}, {H, Mi, S}} = calendar:universal_time(),
    Iso = io_lib:format(
        "~4..0B-~2..0B-~2..0BT~2..0B:~2..0B:~2..0BZ",
        [Y, Mo, D, H, Mi, S]
    ),
    unicode:characters_to_binary(Iso).
