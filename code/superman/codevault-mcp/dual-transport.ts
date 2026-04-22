/**
 * DualFormatTransport — Handles both Content-Length framed and newline-delimited JSON.
 *
 * Claude Desktop may send Content-Length framed messages (LSP-style),
 * while the MCP SDK v1.28+ uses newline-delimited JSON.
 * This transport auto-detects the format and responds in kind.
 *
 * Protocol detection:
 * - If a message starts with "Content-Length:", parse as Content-Length framed
 * - Otherwise, parse as newline-delimited JSON
 *
 * Response format tracks what the client sent:
 * - If client sent Content-Length, respond with Content-Length
 * - If client sent newline-delimited, respond with newline-delimited
 */

import type { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

export class DualFormatTransport implements Transport {
  private _started = false;
  private _buffer = Buffer.alloc(0);
  private _clientFormat: 'content-length' | 'newline' | null = null;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  sessionId?: string;

  async start(): Promise<void> {
    if (this._started) {
      throw new Error('DualFormatTransport already started');
    }
    this._started = true;

    process.stdin.resume();
    process.stdin.on('data', (chunk: Buffer) => {
      this._buffer = Buffer.concat([this._buffer, chunk]);
      this._processBuffer();
    });

    process.stdin.on('end', () => {
      this.onclose?.();
    });

    process.stdin.on('error', (err: Error) => {
      this.onerror?.(err);
    });
  }

  private _processBuffer(): void {
    while (this._buffer.length > 0) {
      const str = this._buffer.toString('utf8');

      // Try Content-Length framed format first
      const clMatch = str.match(/^Content-Length:\s*(\d+)\r?\n\r?\n/);
      if (clMatch) {
        const headerLen = Buffer.byteLength(clMatch[0], 'utf8');
        const bodyLen = parseInt(clMatch[1], 10);
        const totalLen = headerLen + bodyLen;

        if (this._buffer.length < totalLen) break; // Incomplete message

        const body = this._buffer.toString('utf8', headerLen, totalLen);
        this._buffer = this._buffer.subarray(totalLen);
        this._clientFormat = 'content-length';

        try {
          const parsed = JSON.parse(body);
          this.onmessage?.(parsed as JSONRPCMessage);
        } catch (err) {
          this.onerror?.(err instanceof Error ? err : new Error(String(err)));
        }
        continue;
      }

      // Try newline-delimited JSON
      const nlIndex = this._buffer.indexOf(0x0a); // \n
      if (nlIndex === -1) {
        // No complete line — but check if the buffer starts with '{' (partial JSON, not Content-Length)
        // Just wait for more data
        break;
      }

      const line = this._buffer.toString('utf8', 0, nlIndex).replace(/\r$/, '');
      this._buffer = this._buffer.subarray(nlIndex + 1);

      if (line.length === 0) continue; // Skip empty lines

      // Skip Content-Length headers that appear mid-stream (shouldn't happen, but be safe)
      if (line.startsWith('Content-Length:')) continue;

      if (!this._clientFormat) {
        this._clientFormat = 'newline';
      }

      try {
        const parsed = JSON.parse(line);
        this.onmessage?.(parsed as JSONRPCMessage);
      } catch (err) {
        this.onerror?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    const json = JSON.stringify(message);

    let frame: string;
    if (this._clientFormat === 'content-length') {
      // Respond with Content-Length framing
      const byteLength = Buffer.byteLength(json, 'utf8');
      frame = `Content-Length: ${byteLength}\r\n\r\n${json}`;
    } else {
      // Respond with newline-delimited JSON (SDK default)
      frame = json + '\n';
    }

    return new Promise((resolve) => {
      if (process.stdout.write(frame)) {
        resolve();
      } else {
        process.stdout.once('drain', resolve);
      }
    });
  }

  async close(): Promise<void> {
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('end');
    process.stdin.removeAllListeners('error');
    process.stdin.pause();
    this._buffer = Buffer.alloc(0);
    this.onclose?.();
  }
}
