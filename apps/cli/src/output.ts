// Output helpers. Default = pretty human text. --json = NDJSON.

export function emitJson(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

export function emitPretty(line: string): void {
  process.stdout.write(line + "\n");
}

export function emitError(msg: string): void {
  process.stderr.write(msg + "\n");
}
