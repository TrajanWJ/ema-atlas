-module(ema_project_fs).
-export([materialize_project/3]).

materialize_project(ProjectName, ProjectId, DesktopRoot) ->
    Name = safe_name(to_binary(ProjectName)),
    Root = filename:join([to_list(DesktopRoot), "Projects", to_list(Name)]),
    Atlas = filename:join([Root, "atlas"]),
    Builds = filename:join([Root, "builds"]),
    case ensure_dirs([Root, Atlas, Builds]) of
        ok ->
            ok = write_if_missing(
                filename:join([Root, "project.md"]),
                project_md(Name, to_binary(ProjectId), Atlas, Builds)
            ),
            ok = write_if_missing(
                filename:join([Root, "PROJECT-MAP.md"]),
                project_map_md(Name, Atlas, Builds)
            ),
            {ok, to_binary(Root)};
        {error, Reason} ->
            {error, inspect_reason(Reason)}
    end.

ensure_dirs([]) ->
    ok;
ensure_dirs([Dir | Rest]) ->
    case filelib:ensure_dir(filename:join([Dir, ".keep"])) of
        ok ->
            case file:make_dir(Dir) of
                ok -> ensure_dirs(Rest);
                {error, eexist} -> ensure_dirs(Rest);
                {error, Reason} -> {error, Reason}
            end;
        {error, Reason} ->
            {error, Reason}
    end.

write_if_missing(Path, Body) ->
    case file:read_file_info(Path) of
        {ok, _} -> ok;
        {error, enoent} -> file:write_file(Path, Body);
        {error, _} -> file:write_file(Path, Body)
    end.

project_md(Name, ProjectId, Atlas, Builds) ->
    iolist_to_binary([
        <<"# ">>, Name, <<"\n\n">>,
        <<"- project_id: `">>, ProjectId, <<"`\n">>,
        <<"- atlas: `">>, to_binary(Atlas), <<"`\n">>,
        <<"- builds: `">>, to_binary(Builds), <<"`\n\n">>,
        <<"Created by EMA project materialization.\n">>
    ]).

project_map_md(Name, Atlas, Builds) ->
    iolist_to_binary([
        <<"# ">>, Name, <<" Project Map\n\n">>,
        <<"## Folders\n\n">>,
        <<"- `atlas/` -> ">>, to_binary(Atlas), <<"\n">>,
        <<"- `builds/` -> ">>, to_binary(Builds), <<"\n\n">>,
        <<"## Notes\n\n">>,
        <<"This record was created by EMA from a daemon `project.create` command.\n">>
    ]).

safe_name(Value) ->
    Trimmed = string:trim(to_list(Value)),
    Chars = [
        case C of
            $/ -> $-;
            $: -> $-;
            $\\ -> $-;
            _ -> C
        end || C <- Trimmed
    ],
    case unicode:characters_to_binary(Chars) of
        <<>> -> <<"Untitled Project">>;
        Bin -> Bin
    end.

to_binary(Value) when is_binary(Value) -> Value;
to_binary(Value) when is_list(Value) -> unicode:characters_to_binary(Value);
to_binary(Value) -> iolist_to_binary(io_lib:format("~p", [Value])).

to_list(Value) when is_binary(Value) -> binary_to_list(Value);
to_list(Value) when is_list(Value) -> Value;
to_list(Value) -> binary_to_list(to_binary(Value)).

inspect_reason(Reason) when is_binary(Reason) -> Reason;
inspect_reason(Reason) when is_atom(Reason) -> atom_to_binary(Reason, utf8);
inspect_reason(Reason) -> iolist_to_binary(io_lib:format("~p", [Reason])).
