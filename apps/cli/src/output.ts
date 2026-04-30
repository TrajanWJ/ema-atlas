// Output helpers. Default = pretty human text. --json = NDJSON.
// Force blocking writes when Node exposes the handle so large one-shot JSON
// payloads are not truncated when the CLI is invoked through child_process pipes.
declare const process: any;

function writeLine(stream: any, line: string): void {
  stream?._handle?.setBlocking?.(true);
  stream.write(line + "\n");
}

export function emitJson(obj: unknown): void {
  writeLine(process.stdout, JSON.stringify(obj));
}

export function emitPretty(line: string): void {
  writeLine(process.stdout, line);
}

export function emitError(msg: string): void {
  writeLine(process.stderr, msg);
}
