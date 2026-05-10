import gleam/list
import gleam/string

pub fn normalize_path(path: String) -> String {
  let cleaned =
    path
    |> string.trim
    |> string.replace(each: "\\", with: "/")

  let parts =
    cleaned
    |> string.split("/")
    |> list.filter(fn(part) {
      let trimmed = string.trim(part)
      trimmed != "" && trimmed != "."
    })

  string.join(parts, "/")
}

pub fn paths_overlap(existing: String, candidate: String) -> Bool {
  let a = normalize_path(existing)
  let b = normalize_path(candidate)

  case a, b {
    "", _ -> False
    _, "" -> False
    _, _ ->
      a == b
      || string.starts_with(a, b <> "/")
      || string.starts_with(b, a <> "/")
  }
}
