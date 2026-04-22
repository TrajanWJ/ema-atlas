defmodule Ema.Claude.TaskSupervisor do
  @moduledoc """
  TaskSupervisor for async bridge dispatch.

  Spawns Tasks for `ProviderRegistry.async_run/2` so that callers
  get an immediate `{:ok, ref}` instead of blocking up to 120s.
  """

  # This module is a thin wrapper — the actual supervisor is
  # `Task.Supervisor` started with `name: Ema.Claude.TaskSupervisor`
  # in `Ema.Application`.  We keep this file so the module namespace
  # is explicit and discoverable.
end
