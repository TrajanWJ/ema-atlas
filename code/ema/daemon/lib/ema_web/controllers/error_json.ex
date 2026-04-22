defmodule EmaWeb.ErrorJSON do
  def render(template, assigns) do
    %{errors: %{detail: Phoenix.Controller.status_message_from_template(template), meta: assigns}}
  end
end
