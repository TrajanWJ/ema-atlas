-module(ema_attachments@attachments).
-compile([no_auto_import, nowarn_unused_vars, nowarn_unused_function, nowarn_nomatch, inline]).
-define(FILEPATH, "src/ema_attachments/attachments.gleam").
-export([validate/1]).
-export_type([attachment_kind/0, attachment_source/0, source_ref/0, option/1, link_point/0, attachment/0, msg/0, error/0]).

-if(?OTP_RELEASE >= 27).
-define(MODULEDOC(Str), -moduledoc(Str)).
-define(DOC(Str), -doc(Str)).
-else.
-define(MODULEDOC(Str), -compile([])).
-define(DOC(Str), -compile([])).
-endif.

?MODULEDOC(
    " Attachments writer.\n"
    "\n"
    " Handles commands that mutate attachment records and emits\n"
    " `attachment.*` events to the bus. Pointer metadata only — raw\n"
    " file bytes are out of scope for 0.0.5 wave 1.\n"
).

-type attachment_kind() :: kind_file |
    kind_folder |
    kind_git_repo |
    kind_git_path |
    kind_drive_file |
    kind_drive_folder.

-type attachment_source() :: source_local |
    source_google_drive |
    source_github |
    source_git_url.

-type source_ref() :: {local_ref, binary()} |
    {drive_ref, binary(), binary()} |
    {github_ref, binary(), binary(), option(binary()), option(binary())} |
    {git_url_ref, binary(), option(binary()), option(binary())}.

-type option(APN) :: none | {some, APN}.

-type link_point() :: {link_point, binary(), binary()}.

-type attachment() :: {attachment,
        binary(),
        attachment_kind(),
        attachment_source(),
        binary(),
        option(binary()),
        option(integer()),
        source_ref(),
        binary(),
        binary(),
        binary()}.

-type msg() :: {rename,
        binary(),
        binary(),
        gleam@erlang@process:subject({ok, nil} | {error, error()})} |
    {delete,
        binary(),
        binary(),
        gleam@erlang@process:subject({ok, nil} | {error, error()})} |
    {link,
        binary(),
        binary(),
        binary(),
        binary(),
        gleam@erlang@process:subject({ok, nil} | {error, error()})} |
    {unlink,
        binary(),
        binary(),
        binary(),
        binary(),
        gleam@erlang@process:subject({ok, nil} | {error, error()})} |
    {create_from_import,
        attachment(),
        gleam@erlang@process:subject({ok, binary()} | {error, error()})}.

-type error() :: {not_found, binary()} |
    {invalid_args, binary()} |
    {persistence_failed, binary()}.

-file("src/ema_attachments/attachments.gleam", 99).
?DOC(
    " Invariants enforced on a new attachment before emitting\n"
    " `attachment.created`. Kept here so the rule is testable without\n"
    " starting the actor.\n"
).
-spec validate(attachment()) -> {ok, nil} | {error, error()}.
validate(A) ->
    case {erlang:element(4, A), erlang:element(8, A)} of
        {source_local, {local_ref, _}} ->
            {ok, nil};

        {source_google_drive, {drive_ref, _, _}} ->
            {ok, nil};

        {source_github, {github_ref, _, _, _, _}} ->
            {ok, nil};

        {source_git_url, {git_url_ref, _, _, _}} ->
            {ok, nil};

        {_, _} ->
            {error,
                {invalid_args, <<"source_ref tag does not match source"/utf8>>}}
    end.
