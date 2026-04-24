-module(ema_attachments@connectors).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_attachments/connectors.gleam").
-export([demo_label/1, demo_picker_items/1]).
-export_type([provider/0, status/0, connector/0, option/1, picker_item/0, msg/0, error/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Connectors writer (demo-stubbed).\n"
    "\n"
    " Wave 1: the only \"OAuth\" is a state flip. `connector.connect`\n"
    " appends a `connector.connected` event with `fake: true` and a\n"
    " hard-coded display label. `connector.list_picker_items` returns a\n"
    " hard-coded catalog. `connector.import_resource` produces a new\n"
    " attachment record and emits `attachment.created` +\n"
    " `connector.linked_resource_imported`.\n"
).

-type provider() :: google_drive | github.

-type status() :: disconnected | connected.

-type connector() :: {connector,
        binary(),
        binary(),
        provider(),
        status(),
        option(binary()),
        binary(),
        boolean()}.

-type option(AQX) :: none | {some, AQX}.

-type picker_item() :: {picker_item, binary(), provider(), binary(), binary()}.

-type msg() :: {connect,
        binary(),
        provider(),
        gleam@erlang@process:subject({ok, binary()} | {error, error()})} |
    {disconnect,
        binary(),
        binary(),
        gleam@erlang@process:subject({ok, nil} | {error, error()})} |
    {list_picker_items,
        binary(),
        gleam@erlang@process:subject({ok, list(picker_item())} |
            {error, error()})} |
    {import_resource,
        binary(),
        binary(),
        binary(),
        gleam@erlang@process:subject({ok, binary()} | {error, error()})}.

-type error() :: {not_found, binary()} |
    {wrong_status, status()} |
    {unknown_picker_item, binary()} |
    {invalid_args, binary()} |
    {persistence_failed, binary()}.

-file("src/ema_attachments/connectors.gleam", 82).
?DOC(
    " Fake display label for a just-\"connected\" connector.\n"
    " Kept pure for tests.\n"
).
-spec demo_label(provider()) -> binary().
demo_label(P) ->
    case P of
        google_drive ->
            <<"demo@example.com"/utf8>>;

        github ->
            <<"gh:demo-user"/utf8>>
    end.

-file("src/ema_attachments/connectors.gleam", 92).
?DOC(
    " Hard-coded in-memory catalog returned by `ListPickerItems`.\n"
    " This is the only fixture data the daemon ships with — it disappears\n"
    " when real OAuth replaces the stub.\n"
).
-spec demo_picker_items(provider()) -> list(picker_item()).
demo_picker_items(Provider) ->
    case Provider of
        google_drive ->
            [{picker_item,
                    <<"drive:doc-welcome"/utf8>>,
                    google_drive,
                    <<"Welcome to EMA (Doc)"/utf8>>,
                    <<"drive_file"/utf8>>},
                {picker_item,
                    <<"drive:sheet-roadmap"/utf8>>,
                    google_drive,
                    <<"0.0.5 Roadmap (Sheet)"/utf8>>,
                    <<"drive_file"/utf8>>},
                {picker_item,
                    <<"drive:folder-specs"/utf8>>,
                    google_drive,
                    <<"Specs / (Folder)"/utf8>>,
                    <<"drive_folder"/utf8>>}];

        github ->
            [{picker_item,
                    <<"gh:anthropics/claude-code"/utf8>>,
                    github,
                    <<"anthropics/claude-code"/utf8>>,
                    <<"git_repo"/utf8>>},
                {picker_item,
                    <<"gh:ema/runtime"/utf8>>,
                    github,
                    <<"ema/runtime"/utf8>>,
                    <<"git_repo"/utf8>>},
                {picker_item,
                    <<"gh:ema/runtime@main:/docs"/utf8>>,
                    github,
                    <<"ema/runtime · docs/ (path)"/utf8>>,
                    <<"git_path"/utf8>>}]
    end.
