%% Telemetry FFI used by ema_daemon/telemetry.gleam
%%
%% Returns a flat snapshot of every live BEAM process with mailbox depth and
%% the cumulative reductions counter. The Gleam side compares successive
%% reductions deltas across the rolling window to derive a CPU-time proxy
%% per pid. Mailbox depth is sampled directly.
%%
%% Output shape: list of {Pid :: binary, Name :: binary, MailboxLen :: int,
%%                       Reductions :: int}.
-module(ema_telemetry_ffi).

-export([processes_info/0, monotonic_ms/0]).

processes_info() ->
    Pids = erlang:processes(),
    lists:foldl(
        fun(Pid, Acc) ->
            case erlang:process_info(Pid, [registered_name, message_queue_len, reductions]) of
                undefined ->
                    Acc;
                Info ->
                    Name = name_of(Info, Pid),
                    MailboxLen = proplists:get_value(message_queue_len, Info, 0),
                    Reductions = proplists:get_value(reductions, Info, 0),
                    PidBin = unicode:characters_to_binary(pid_to_list(Pid)),
                    [{PidBin, Name, MailboxLen, Reductions} | Acc]
            end
        end,
        [],
        Pids
    ).

monotonic_ms() ->
    erlang:monotonic_time(millisecond).

%% --------------------------------------------------------------------------
%% Helpers
%% --------------------------------------------------------------------------

name_of(Info, Pid) ->
    case proplists:get_value(registered_name, Info) of
        [] ->
            unicode:characters_to_binary(pid_to_list(Pid));
        undefined ->
            unicode:characters_to_binary(pid_to_list(Pid));
        Atom when is_atom(Atom) ->
            unicode:characters_to_binary(atom_to_list(Atom))
    end.
