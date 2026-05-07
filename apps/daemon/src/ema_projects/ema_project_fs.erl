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
            ok = write_if_missing(
                filename:join([Root, ".gitignore"]),
                gitignore()
            ),
            case ensure_git_repo(Root) of
                ok -> {ok, to_binary(Root)};
                {error, Reason} -> {error, Reason}
            end;
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
        <<"## Storage\n\n">>,
        <<"- Driver: `git_worktree`\n">>,
        <<"- Versioning: local Git repository initialized at project root.\n\n">>,
        <<"## Notes\n\n">>,
        <<"This record was created by EMA from a daemon `project.create` command.\n">>,
        <<"Project storage is versioned through Git by default; daemon events remain canonical coordination truth.\n">>
    ]).

gitignore() ->
    <<
        ".DS_Store\n",
        ".ema-dev/\n",
        "node_modules/\n",
        ".next/\n",
        "dist/\n",
        "build/\n"
    >>.

ensure_git_repo(Root) ->
    GitDir = filename:join([Root, ".git"]),
    case filelib:is_dir(GitDir) of
        true -> ok;
        false -> run_git(["init", "-b", "main", Root])
    end.

run_git(Args) ->
    case os:find_executable("git") of
        false -> {error, <<"git executable not found">>};
        Git ->
            Port = open_port(
                {spawn_executable, Git},
                [{args, Args}, exit_status, stderr_to_stdout, binary]
            ),
            collect_git_port(Port, [])
    end.

collect_git_port(Port, Acc) ->
    receive
        {Port, {data, Data}} ->
            collect_git_port(Port, [Data | Acc]);
        {Port, {exit_status, 0}} ->
            ok;
        {Port, {exit_status, Status}} ->
            Output = iolist_to_binary(lists:reverse(Acc)),
            {error, iolist_to_binary(io_lib:format("git init failed (~p): ~s", [Status, Output]))}
    after 5000 ->
        port_close(Port),
        {error, <<"git init timed out">>}
    end.

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
