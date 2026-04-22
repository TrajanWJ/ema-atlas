defmodule Ema.Babysitter.TakeoverManager do
  @moduledoc """
  GenServer managing babysitter takeover state per stream.

  Each stream tracks a state machine:

      :idle → :armed → :active → :cooldown → :idle

  Any state can be forced to :suppressed via manual suppress, which clears
  on release.

  ## Transitions

    * `:idle` → `:armed`     — `arm/2`: activity threshold suggests babysitter needed
    * `:armed` → `:active`   — `activate/3`: explicit claim or auto-trigger
    * `:active` → `:cooldown` — `release/1`: babysitter relinquishes control
    * `:cooldown` → `:idle`   — automatic after `cooldown_ms` (default 5 min)
    * Any → `:suppressed`     — `suppress/1`: manual operator override
    * `:suppressed` → `:idle` — `release/1`: clears suppression

  ## State per stream

      %{
        stream: String.t(),
        mode: :auto | :manual | :suppressed,
        takeover_state: :idle | :armed | :active | :cooldown,
        last_takeover_at: DateTime.t() | nil,
        last_takeover_reason: String.t() | nil,
        lease_owner: String.t() | nil,
        cooldown_until: DateTime.t() | nil
      }
  """

  use GenServer

  require Logger

  @default_cooldown_ms 300_000

  # --- Public API ---

  @doc "Return the current takeover state for a stream."
  @spec status(String.t()) :: map()
  def status(stream) do
    GenServer.call(__MODULE__, {:status, stream})
  end

  @doc "Arm the takeover for a stream (activity threshold crossed)."
  @spec arm(String.t(), String.t()) :: :ok
  def arm(stream, reason) do
    GenServer.cast(__MODULE__, {:arm, stream, reason})
  end

  @doc "Activate (claim) takeover for a stream."
  @spec activate(String.t(), String.t(), String.t()) :: :ok
  def activate(stream, owner, reason) do
    GenServer.cast(__MODULE__, {:activate, stream, owner, reason})
  end

  @doc "Release takeover for a stream (transitions to cooldown or clears suppression)."
  @spec release(String.t()) :: :ok
  def release(stream) do
    GenServer.cast(__MODULE__, {:release, stream})
  end

  @doc "Suppress the takeover for a stream (manual operator override)."
  @spec suppress(String.t()) :: :ok
  def suppress(stream) do
    GenServer.cast(__MODULE__, {:suppress, stream})
  end

  # --- GenServer Lifecycle ---

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    Logger.info("[TakeoverManager] started")
    {:ok, %{streams: %{}}}
  end

  # --- Callbacks ---

  @impl true
  def handle_call({:status, stream}, _from, state) do
    entry = get_or_init(state, stream)
    {:reply, entry, state}
  end

  @impl true
  def handle_cast({:arm, stream, reason}, state) do
    state = update_stream(state, stream, fn entry ->
      case entry.takeover_state do
        :idle ->
          Logger.debug("[TakeoverManager] #{stream}: idle → armed (#{reason})")
          %{entry | takeover_state: :armed, last_takeover_reason: reason, mode: :auto}

        other ->
          Logger.debug("[TakeoverManager] #{stream}: arm ignored in state #{other}")
          entry
      end
    end)

    {:noreply, state}
  end

  @impl true
  def handle_cast({:activate, stream, owner, reason}, state) do
    state = update_stream(state, stream, fn entry ->
      case entry.takeover_state do
        s when s in [:idle, :armed] ->
          mode = if owner == "operator", do: :manual, else: :auto
          Logger.info("[TakeoverManager] #{stream}: #{s} → active (owner=#{owner}, reason=#{reason})")
          %{entry |
            takeover_state: :active,
            mode: mode,
            lease_owner: owner,
            last_takeover_at: DateTime.utc_now(),
            last_takeover_reason: reason,
            cooldown_until: nil
          }

        :active ->
          # Re-claim: update owner/reason but stay active
          Logger.debug("[TakeoverManager] #{stream}: re-activated by #{owner}")
          %{entry |
            lease_owner: owner,
            last_takeover_at: DateTime.utc_now(),
            last_takeover_reason: reason
          }

        other ->
          Logger.debug("[TakeoverManager] #{stream}: activate ignored in state #{other}")
          entry
      end
    end)

    {:noreply, state}
  end

  @impl true
  def handle_cast({:release, stream}, state) do
    state = update_stream(state, stream, fn entry ->
      case entry.takeover_state do
        :active ->
          cooldown_ms = cooldown_ms()
          cooldown_until = DateTime.add(DateTime.utc_now(), cooldown_ms, :millisecond)
          Logger.info("[TakeoverManager] #{stream}: active → cooldown (until #{DateTime.to_iso8601(cooldown_until)})")
          Process.send_after(self(), {:cooldown_expired, stream}, cooldown_ms)
          %{entry |
            takeover_state: :cooldown,
            mode: :auto,
            lease_owner: nil,
            cooldown_until: cooldown_until
          }

        :suppressed ->
          Logger.info("[TakeoverManager] #{stream}: suppressed → idle (released)")
          %{entry |
            takeover_state: :idle,
            mode: :auto,
            lease_owner: nil,
            cooldown_until: nil
          }

        other ->
          Logger.debug("[TakeoverManager] #{stream}: release ignored in state #{other}")
          entry
      end
    end)

    {:noreply, state}
  end

  @impl true
  def handle_cast({:suppress, stream}, state) do
    state = update_stream(state, stream, fn entry ->
      Logger.info("[TakeoverManager] #{stream}: #{entry.takeover_state} → suppressed")
      %{entry |
        takeover_state: :suppressed,
        mode: :suppressed,
        lease_owner: nil,
        cooldown_until: nil
      }
    end)

    {:noreply, state}
  end

  @impl true
  def handle_info({:cooldown_expired, stream}, state) do
    state = update_stream(state, stream, fn entry ->
      case entry.takeover_state do
        :cooldown ->
          Logger.debug("[TakeoverManager] #{stream}: cooldown → idle")
          %{entry | takeover_state: :idle, cooldown_until: nil}

        _ ->
          # State changed in the meantime — no-op
          entry
      end
    end)

    {:noreply, state}
  end

  # --- Private Helpers ---

  defp get_or_init(state, stream) do
    Map.get_lazy(state.streams, stream, fn -> init_entry(stream) end)
  end

  defp update_stream(state, stream, fun) do
    entry = get_or_init(state, stream)
    updated = fun.(entry)
    put_in(state, [:streams, stream], updated)
  end

  defp init_entry(stream) do
    %{
      stream: stream,
      mode: :auto,
      takeover_state: :idle,
      last_takeover_at: nil,
      last_takeover_reason: nil,
      lease_owner: nil,
      cooldown_until: nil
    }
  end

  defp cooldown_ms do
    Application.get_env(:ema, :takeover_cooldown_ms, @default_cooldown_ms)
  end
end
