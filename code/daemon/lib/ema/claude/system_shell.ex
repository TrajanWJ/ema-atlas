defmodule Ema.Claude.SystemShell do
  @moduledoc false

  @behaviour Ema.Claude.Shell

  @impl true
  def cmd(command, args, opts \\ []) do
    System.cmd(command, args, opts)
  end
end
