-module(ema_artifact_storage).
-export([write_content/2]).

write_content(_ArtifactId, Content) ->
    ContentBin = unicode:characters_to_binary(Content),
    Hash = hex(crypto:hash(sha256, ContentBin)),
    StoragePath = <<".ema-dev/artifacts/by-hash/", Hash/binary, "/content">>,
    case filelib:ensure_dir(binary_to_list(StoragePath)) of
        ok ->
            case file:write_file(binary_to_list(StoragePath), ContentBin) of
                ok -> {ok, {Hash, StoragePath, byte_size(ContentBin)}};
                {error, Reason} -> {error, inspect_reason(Reason)}
            end;
        {error, Reason} ->
            {error, inspect_reason(Reason)}
    end.

hex(Bin) ->
    iolist_to_binary([io_lib:format("~2.16.0b", [Byte]) || <<Byte>> <= Bin]).

inspect_reason(Reason) ->
    iolist_to_binary(io_lib:format("~p", [Reason])).
