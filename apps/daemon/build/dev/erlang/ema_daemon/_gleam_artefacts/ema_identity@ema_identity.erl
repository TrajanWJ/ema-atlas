-module(ema_identity@ema_identity).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_identity/ema_identity.gleam").
-export_type([placeholder/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " ema_identity — users, devices, keys.\n"
    "\n"
    " Wave 1: stub. Public API is the command ops this context handles;\n"
    " see `../../packages/contracts/ipc/shell-protocol.md`.\n"
).

-type placeholder() :: placeholder.


