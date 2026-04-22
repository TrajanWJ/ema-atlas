defmodule Ema.Claude.Shell do
  @moduledoc false

  @callback cmd(command :: binary(), args :: [binary()], opts :: keyword()) :: {binary(), non_neg_integer()}
end
