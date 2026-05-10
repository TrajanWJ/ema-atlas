%% Minimal external-process boundary for the B1 Iroh sidecar actor.

-module(ema_sidecar_port).
-export([open/2, close/1]).

open(Command0, Args0) ->
    Command = to_list(Command0),
    case os:find_executable(Command) of
        false ->
            {error, iolist_to_binary(["binary not found: ", Command])};
        Path ->
            Args = [to_list(Arg) || Arg <- Args0],
            try
                Port = open_port(
                    {spawn_executable, Path},
                    [binary, exit_status, {args, Args}]
                ),
                {ok, Port}
            catch
                Class:Reason ->
                    {error, iolist_to_binary(io_lib:format("~p:~p", [Class, Reason]))}
            end
    end.

close(Port) ->
    catch port_close(Port),
    nil.

to_list(Value) when is_binary(Value) ->
    binary_to_list(Value);
to_list(Value) ->
    Value.
