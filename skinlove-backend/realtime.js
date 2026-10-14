import { EventEmitter } from "node:events";

// In-process pub/sub used to push real-time events to connected admins.
// A single Render instance is assumed (free tier), so this is sufficient.
export const bus = new EventEmitter();
bus.setMaxListeners(0);

export function publish(type, payload = {}) {
  const event = { type, ...payload, at: new Date().toISOString() };
  bus.emit("event", event);
  return event;
}
