// Per-channel ring buffer. Plain TS, zero deps.
//
// Keeps the last N events per channel so late subscribers can replay a short
// window via `?since=<ts>` on WS upgrade. Not intended as durable storage —
// the API service (F6) remains source of truth.

import type { Event, EventChannel } from "./types.ts";

const DEFAULT_CAPACITY = 100;

export class RingBuffer {
  private readonly capacity: number;
  private readonly buffers: Map<EventChannel, Event[]> = new Map();

  constructor(capacity: number = DEFAULT_CAPACITY) {
    this.capacity = capacity;
  }

  push(event: Event): void {
    const existing = this.buffers.get(event.channel);
    if (!existing) {
      this.buffers.set(event.channel, [event]);
      return;
    }
    existing.push(event);
    if (existing.length > this.capacity) {
      // drop oldest — typed array splice keeps allocation cheap for N=100.
      existing.splice(0, existing.length - this.capacity);
    }
  }

  since(channel: EventChannel, ts: number): Event[] {
    const existing = this.buffers.get(channel);
    if (!existing) return [];
    return existing.filter((e) => e.ts > ts);
  }

  all(channel: EventChannel): Event[] {
    return this.buffers.get(channel)?.slice() ?? [];
  }

  channels(): EventChannel[] {
    return Array.from(this.buffers.keys());
  }

  size(channel: EventChannel): number {
    return this.buffers.get(channel)?.length ?? 0;
  }

  clear(): void {
    this.buffers.clear();
  }
}
