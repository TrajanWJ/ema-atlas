-module(ema_spaces@ema_spaces).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_spaces/ema_spaces.gleam").
-export_type([placeholder/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " ema_spaces — spaces inside an org.\n"
    "\n"
    " Wave 1: stub.\n"
).

-type placeholder() :: placeholder.


