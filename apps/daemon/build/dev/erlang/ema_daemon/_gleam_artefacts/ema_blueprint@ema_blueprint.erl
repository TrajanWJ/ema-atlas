-module(ema_blueprint@ema_blueprint).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_blueprint/ema_blueprint.gleam").
-export_type([placeholder/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " ema_blueprint — structural blueprint truth.\n"
    "\n"
    " Wave 1: stub. Prose Yjs server lives here in a later wave.\n"
).

-type placeholder() :: placeholder.


