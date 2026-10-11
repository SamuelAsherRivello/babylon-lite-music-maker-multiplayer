export const STEP_MS = 500;
export const REMOTE_MS = 3000;
export const SOUNDS = Object.freeze(["kick", "snare", "hat", "tone"]);
export const absoluteStep = (now, start) =>
  Math.max(0, Math.floor((now - start) / STEP_MS));
export const nextStep = (now, start) => absoluteStep(now, start) + 1;
export const circle = (step) => ((step % 8) + 8) % 8;
export const deadlineFor = (start, step) => start + step * STEP_MS;
export const eventKey = (e) => `${e.epoch}/${e.origin}/${e.step}/${e.sound}`;
export function listenerDeadline(event, listener) {
  return event.deadline + (event.origin === listener ? 0 : REMOTE_MS);
}

export class EventLedger {
  constructor(epoch, start) {
    this.epoch = epoch;
    this.start = start;
    this.events = new Map();
    this.sequence = 0;
  }
  accept(intent, now) {
    this.prune(now);
    if (
      intent.epoch !== this.epoch ||
      !SOUNDS.includes(intent.sound) ||
      !Number.isSafeInteger(intent.step) ||
      intent.step < 0 ||
      intent.step > nextStep(now, this.start) ||
      typeof intent.origin !== "string"
    )
      return null;
    const deadline = deadlineFor(this.start, intent.step);
    if (deadline + REMOTE_MS < now + 100) return null;
    const key = eventKey(intent);
    if (this.events.has(key)) return null;
    const event = { ...intent, deadline, sequence: ++this.sequence };
    this.events.set(key, event);
    return event;
  }
  prune(now) {
    for (const [key, e] of this.events)
      if (e.deadline < now - 8000) this.events.delete(key);
  }
  pending(now) {
    this.prune(now);
    return [...this.events.values()].filter(
      (e) => e.deadline + REMOTE_MS > now,
    );
  }
}

export class ClockSync {
  constructor() {
    this.offset = 0;
    this.best = Infinity;
    this.ready = false;
  }
  sample({ sent, received, hostNow }, localNow) {
    const rtt = Math.max(0, localNow - sent - (hostNow - received));
    const offset = (received - sent + (hostNow - localNow)) / 2;
    if (!Number.isFinite(offset) || !Number.isFinite(rtt)) return false;
    if (!this.ready || rtt <= this.best + 5) {
      this.offset = this.ready
        ? this.offset + Math.max(-5, Math.min(5, offset - this.offset))
        : offset;
      this.best = Math.min(this.best, rtt);
      this.ready = true;
      return true;
    }
    return false;
  }
}
