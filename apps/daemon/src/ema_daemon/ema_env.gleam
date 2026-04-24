//// Tiny wrapper over Erlang's `os:getenv` that returns a
//// `Result(String, Nil)` for nicer pattern-matching from Gleam.

pub fn getenv_or(name: String, default: String) -> String {
  case getenv(name) {
    Ok(value) -> value
    Error(_) -> default
  }
}

@external(erlang, "ema_env_ffi", "getenv")
pub fn getenv(name: String) -> Result(String, Nil)
