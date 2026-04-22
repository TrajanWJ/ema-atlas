defmodule EmaWeb.ChannelCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      use Phoenix.ChannelTest
      @endpoint EmaWeb.Endpoint
    end
  end
end
