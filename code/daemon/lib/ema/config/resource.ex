defmodule Ema.Config.Resource do
  @moduledoc "Represents a config resource discovered from the filesystem"

  @type resource_type :: :skill | :agent | :hook | :mcp_server | :command | :auth_profile
  @type scope :: :user | :project | :agent | :plugin

  @enforce_keys [:id, :type, :name, :scope, :source_path]
  defstruct [
    :id,
    :type,
    :name,
    :scope,
    :source_path,
    enabled: true,
    metadata: %{},
    inserted_at: nil
  ]

  @type t :: %__MODULE__{
    id: String.t(),
    type: resource_type(),
    name: String.t(),
    scope: scope(),
    source_path: String.t(),
    enabled: boolean(),
    metadata: map(),
    inserted_at: DateTime.t() | nil
  }
end
