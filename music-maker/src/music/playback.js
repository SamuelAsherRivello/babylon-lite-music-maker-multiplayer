import {
  EventLedger,
  ClockSync,
  SOUNDS,
  nextStep,
  absoluteStep,
  deadlineFor,
  eventKey,
  listenerDeadline,
} from "./rules.js";

/** Musical simulation, independent of the relay implementation and rendering. */
export class Playback {
  constructor({
    audio,
    now = () => performance.now(),
    send = () => {},
    changed = () => {},
  }) {
    Object.assign(this, { audio, now, send, changed });
    this.clock = new ClockSync();
    this.epoch = "";
    this.start = 0;
    this.id = "";
    this.host = false;
    this.sequence = 0;
    this.predictions = new Map();
    this.seen = new Map();
    this.pending = new Map();
    this.origins = new Set();
    this.queued = new Map();
    this.lastBeep = -1;
    this.late = 0;
    this.message = "Synchronizing clock…";
    this.ledger = null;
  }
  get time() {
    return this.now() + (this.host ? 0 : this.clock.offset);
  }
  get active() {
    return !!this.epoch && (this.host || this.clock.ready);
  }
  identify(id, host) {
    this.id = id;
    this.origins.add(id);
    this.host = host;
    if (host && !this.epoch) {
      this.epoch = crypto.randomUUID();
      this.start = this.now();
      this.ledger = new EventLedger(this.epoch, this.start);
      this.message =
        "Tap pads or press 1–4. Your friends hear you 3 seconds later.";
    }
  }
  snapshot(target, extra = {}) {
    return {
      target,
      epoch: this.epoch,
      start: this.start,
      hostNow: this.time,
      sequence: this.ledger?.sequence || 0,
      events: this.ledger?.pending(this.time) || [],
      ...extra,
    };
  }
  receive(type, v) {
    if (type === "musicClockRequest" && this.host) {
      const received = this.now();
      this.send("musicClockReply", {
        target: v.origin,
        request: v.request,
        sent: v.sent,
        received,
        hostNow: this.now(),
        epoch: this.epoch,
        start: this.start,
      });
    }
    if (type === "musicClockReply" && !this.host) {
      this.setEpoch(v.epoch, v.start);
      this.clock.sample(v, this.now());
      this.message =
        "Tap pads or press 1–4. Your friends hear you 3 seconds later.";
    }
    if (type === "musicSnapshotRequest" && this.host)
      this.send("musicSnapshot", this.snapshot(v.target));
    if (type === "musicSnapshot" && !this.host) {
      this.setEpoch(v.epoch, v.start);
      for (const e of v.events) this.commit(e);
    }
    if (type === "musicIntent" && this.host) this.accept(v);
    if (type === "musicCommit") this.commit(v);
    if (type === "musicRejected") {
      const p = this.predictions.get(v.sequence);
      if (p) {
        p.accepted = false;
        this.message =
          "A local tap could not be shared; it was too late for the relay buffer.";
      }
    }
  }
  setEpoch(epoch, start) {
    if (this.epoch && epoch !== this.epoch) {
      this.audio.cancel();
      this.pending.clear();
      this.seen.clear();
      this.predictions.clear();
      this.queued.clear();
      this.lastBeep = -1;
      this.clock = new ClockSync();
    }
    this.epoch = epoch;
    this.start = start;
  }
  tap(sound) {
    if (!this.active || !this.audio.ready || !SOUNDS.includes(sound))
      return false;
    const now = this.time,
      step = nextStep(now, this.start),
      event = {
        epoch: this.epoch,
        origin: this.id,
        step,
        sound,
        sequence: ++this.sequence,
        deadline: deadlineFor(this.start, step),
      };
    const key = eventKey(event);
    if (this.seen.has(key)) return false;
    this.seen.set(key, event.deadline);
    this.predictions.set(event.sequence, event);
    this.queued.set(sound, step);
    this.audio.play(sound, event.deadline, now, {
      kind: "local",
      key,
      sourceDeadline: event.deadline,
      step,
      origin: this.id,
    });
    if (this.host) this.accept(event);
    else
      this.send("musicIntent", {
        epoch: event.epoch,
        sequence: event.sequence,
        step,
        sound,
      });
    this.changed();
    return true;
  }
  accept(intent) {
    const event = this.ledger.accept(intent, this.time);
    if (!event) {
      this.send("musicRejected", {
        target: intent.origin,
        sequence: intent.sequence,
      });
      return;
    }
    this.commit(event);
    this.send("musicCommit", event);
  }
  commit(event) {
    if (event.epoch !== this.epoch) return;
    const key = eventKey(event);
    if (this.origins.has(event.origin)) {
      const p = [...this.predictions.values()].find(
        (p) => p.step === event.step && p.sound === event.sound,
      );
      if (p) p.accepted = true;
      return;
    }
    if (this.seen.has(key)) return;
    this.seen.set(key, event.deadline);
    const deadline = listenerDeadline(event, this.id);
    if (deadline < this.time - 25) {
      this.late++;
      this.message = `Dropped ${this.late} late remote event${this.late === 1 ? "" : "s"}.`;
      return;
    }
    this.pending.set(key, { ...event, playAt: deadline });
  }
  tick() {
    if (!this.active) return;
    const now = this.time,
      step = absoluteStep(now, this.start);
    for (const [s, target] of this.queued)
      if (target <= step) this.queued.delete(s);
    for (const [key, event] of this.pending) {
      if (!this.audio.ready && event.playAt >= now - 25) continue;
      if (event.playAt <= now + 125) {
        this.pending.delete(key);
        if (
          !this.audio.play(event.sound, event.playAt, this.time, {
            kind: "remote",
            key,
            sourceDeadline: event.deadline,
            step: event.step,
            origin: event.origin,
          })
        ) {
          this.late++;
          this.message = "A late or suspended remote sound was dropped.";
        }
      }
    }
    const beep = Math.max(step, this.lastBeep + 1),
      deadline = deadlineFor(this.start, beep);
    if (deadline <= now + 125) {
      this.lastBeep = beep;
      if (deadline >= now - 25)
        this.audio.play("beep", deadline, this.time, {
          kind: "metronome",
          step: beep,
        });
    }
    for (const [key, at] of this.seen)
      if (at < now - 8000) this.seen.delete(key);
    for (const [key, event] of this.predictions)
      if (event.deadline < now - 8000) this.predictions.delete(key);
    this.ledger?.prune(now);
  }
  resume() {
    this.audio.cancel();
    // A fresh snapshot may replay still-future buffered events after sound unlock.
    // Forget only unscheduled entries; keep already-heard identities deduplicated.
    for (const key of this.pending.keys()) this.seen.delete(key);
    this.pending.clear();
    this.lastBeep = absoluteStep(this.time, this.start);
    this.message = "Audio resumed. Old sounds were skipped.";
  }
  view() {
    const now = this.time;
    return {
      active: this.active,
      step: absoluteStep(now, this.start),
      phase: Math.max(0, (now - this.start) % 500) / 500,
      queued: [...this.queued.keys()],
      notice: this.message,
      late: this.late,
    };
  }
  stop() {
    this.audio.cancel();
    this.pending.clear();
    this.queued.clear();
    this.epoch = "";
    this.clock = new ClockSync();
  }
}
