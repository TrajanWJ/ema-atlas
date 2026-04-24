-module(ema_replication@ema_replication).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_replication/ema_replication.gleam").
-export_type([placeholder/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " ema_replication — lease, peer state, replication transport.\n"
    "\n"
    " Wave 1: stub. See `docs/architecture/04-lease-authority.md`.\n"
).

-type placeholder() :: placeholder.


