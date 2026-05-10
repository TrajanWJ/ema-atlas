defmodule EmaDaemon.MixProject do
  @moduledoc """
  Mix project for the Elixir contexts that live alongside the Gleam daemon.

  Slice 2 of the EMA-absorbs-cwt migration. The strategy is parallel
  compilation: Gleam compiles via `gleam build` to `build/dev/erlang`,
  Mix compiles via `mix compile` to `_build/dev`. Both emit BEAM
  bytecode and both end up reachable from the same OTP runtime — the
  Gleam supervisor can name-call into `:'Elixir.EmaClients.Server'`
  exactly like any other registered GenServer.

  New Elixir contexts (`EmaClients`, `EmaResponsibilities`) live under
  `lib/`. ExUnit tests live under `test/`. The existing Gleam contexts
  under `src/` are not touched — the point of "mix" is parallel-language
  coexistence, not replacement.
  """

  use Mix.Project

  def project do
    [
      app: :ema_daemon_elixir,
      version: "0.0.6",
      elixir: "~> 1.17",
      elixirc_paths: ["lib"],
      test_paths: ["test"],
      # ExUnit needs `.exs` test files; Gleam's `.gleam` tests sit
      # alongside but Mix never sees them.
      test_pattern: "*_test.exs",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      description:
        "Elixir contexts (EmaClients, EmaResponsibilities) for the EMA daemon. " <>
          "Coexists with Gleam contexts under apps/daemon/src/."
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {EmaDaemon.ElixirApplication, []}
    ]
  end

  defp deps do
    []
  end
end
