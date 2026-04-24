-module(ema_test_helpers).
-export([tmp_path/1, delete_file/1]).

tmp_path(Suffix) when is_binary(Suffix) ->
    Base = integer_to_binary(erlang:system_time(microsecond)),
    <<"/tmp/", Base/binary, "-", Suffix/binary>>.

delete_file(Path) when is_binary(Path) ->
    case file:delete(Path) of
        ok -> {ok, nil};
        {error, _} -> {ok, nil}
    end.
