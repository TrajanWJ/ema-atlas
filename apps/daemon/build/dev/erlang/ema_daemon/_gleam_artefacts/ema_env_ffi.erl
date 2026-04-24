-module(ema_env_ffi).
-export([getenv/1]).

getenv(Name) when is_binary(Name) ->
    getenv(binary_to_list(Name));
getenv(Name) when is_list(Name) ->
    case os:getenv(Name) of
        false -> {error, nil};
        Value -> {ok, unicode:characters_to_binary(Value)}
    end.
