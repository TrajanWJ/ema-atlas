-module(ema_daemon_test).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "test/ema_daemon_test.gleam").
-export([main/0, bus_assigns_sequential_txids_test/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

-file("test/ema_daemon_test.gleam", 7).
-spec main() -> nil.
main() ->
    gleeunit:main().

-file("test/ema_daemon_test.gleam", 32).
-spec sample_envelope(binary()) -> ema_daemon@event_envelope:envelope().
sample_envelope(Event_id) ->
    {envelope,
        Event_id,
        <<"dispatch.started"/utf8>>,
        <<"2026-04-24T00:00:00Z"/utf8>>,
        <<"actor:test"/utf8>>,
        <<"org:test"/utf8>>,
        ema_daemon@event_envelope:none(),
        ema_daemon@event_envelope:none(),
        ema_daemon@event_envelope:some(<<"dispatch:test"/utf8>>),
        ema_daemon@event_envelope:none(),
        <<"{}"/utf8>>}.

-file("test/ema_daemon_test.gleam", 13).
?DOC(
    " M1 smoke test: start a bus on a throwaway db and confirm the first\n"
    " two appends produce txid 1 and 2, respectively.\n"
).
-spec bus_assigns_sequential_txids_test() -> {ok, nil} | {error, nil}.
bus_assigns_sequential_txids_test() ->
    Path = ema_test_helpers:tmp_path(<<"ema-m1-bus.db"/utf8>>),
    _ = ema_test_helpers:delete_file(Path),
    Started@1 = case ema_daemon@bus:start(Path) of
        {ok, Started} -> Started;
        _assert_fail ->
            erlang:error(#{gleam_error => let_assert,
                        message => <<"Pattern match failed, no pattern matched the value."/utf8>>,
                        file => <<?FILEPATH/utf8>>,
                        module => <<"ema_daemon_test"/utf8>>,
                        function => <<"bus_assigns_sequential_txids_test"/utf8>>,
                        line => 17,
                        value => _assert_fail,
                        start => 382,
                        'end' => 422,
                        pattern_start => 393,
                        pattern_end => 404})
    end,
    Bus_subject = erlang:element(3, Started@1),
    E1 = sample_envelope(<<"event:test-1"/utf8>>),
    E2 = sample_envelope(<<"event:test-2"/utf8>>),
    Txid1@1 = case ema_daemon@bus:append(Bus_subject, E1) of
        {ok, Txid1} -> Txid1;
        _assert_fail@1 ->
            erlang:error(#{gleam_error => let_assert,
                        message => <<"Pattern match failed, no pattern matched the value."/utf8>>,
                        file => <<?FILEPATH/utf8>>,
                        module => <<"ema_daemon_test"/utf8>>,
                        function => <<"bus_assigns_sequential_txids_test"/utf8>>,
                        line => 23,
                        value => _assert_fail@1,
                        start => 546,
                        'end' => 596,
                        pattern_start => 557,
                        pattern_end => 566})
    end,
    Txid2@1 = case ema_daemon@bus:append(Bus_subject, E2) of
        {ok, Txid2} -> Txid2;
        _assert_fail@2 ->
            erlang:error(#{gleam_error => let_assert,
                        message => <<"Pattern match failed, no pattern matched the value."/utf8>>,
                        file => <<?FILEPATH/utf8>>,
                        module => <<"ema_daemon_test"/utf8>>,
                        function => <<"bus_assigns_sequential_txids_test"/utf8>>,
                        line => 24,
                        value => _assert_fail@2,
                        start => 599,
                        'end' => 649,
                        pattern_start => 610,
                        pattern_end => 619})
    end,
    gleeunit@should:equal(Txid1@1, 1),
    gleeunit@should:equal(Txid2@1, 2),
    _ = ema_test_helpers:delete_file(Path).
