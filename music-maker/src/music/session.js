import { MusicAudio } from "./audio.js";
import { Playback } from "./playback.js";

const endpoint =
  import.meta.env?.VITE_MULTIPLAYER_URL ||
  "https://rmc-music-maker.vercel.app";
export class MusicSession {
  constructor() {
    this.audio = new MusicAudio();
    this.listeners = new Set();
    this.client = null;
    this.closed = false;
    this.renewing = false;
    this.renewals = 0;
    this.transportQueue = [];
    this.requests = 0;
    this.lastClock = -Infinity;
    this.joinedAt = 0;
    this.status = "idle";
    this.players = [];
    this.code = "";
    this.timerHandles = new Set();
    this.playback = new Playback({
      audio: this.audio,
      send: (type, data) => this.send(type, data),
      changed: () => this.emit(),
    });
    this.timer = setInterval(() => this.tick(), 25);
    this.visibility = () => {
      if (document.hidden) {
        this.audio.cancel();
        this.playback.pending.clear();
      } else if (this.audio.ready) this.resume();
    };
    document.addEventListener("visibilitychange", this.visibility);
    this.audioState = () => {
      if (!this.audio.ready) {
        this.playback.pending.clear();
        this.emit();
      }
    };
    if (new URLSearchParams(location.search).get("test") === "1")
      window.__musicDebug = this;
  }
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.view());
    return () => this.listeners.delete(fn);
  }
  notice(text) {
    this.playback.message = text;
    this.emit();
  }
  view() {
    return {
      ...this.playback.view(),
      status: this.status,
      id: this.playback.id,
      players: this.players,
      code: this.code,
      renewals: this.renewals,
      audioReady: this.audio.ready,
    };
  }
  emit() {
    for (const fn of this.listeners) fn(this.view());
  }
  async connect(create, code) {
    const { MultiplayerClient } = await import("@rmc/multiplayer-client");
    this.Client = MultiplayerClient;
    await this.attach(create, code);
    if (this.audio.context) this.audio.context.onstatechange = this.audioState;
  }
  async attach(create, code) {
    const c = new this.Client(
      endpoint,
      "music-maker",
      create ? { create: true, ...(code ? { code } : {}) } : { code },
    );
    this.client = c;
    this.status = this.renewing ? "connected" : "connecting";
    c.subscribe((state, type) => {
      if (c !== this.client || this.closed) return;
      const v = state.musicMessage;
      if (state.status === "connected") {
        this.code = state.code;
        this.players = state.players;
        this.status = "connected";
        if (state.sessionId !== this.playback.id) {
          this.playback.identify(
            state.sessionId,
            state.hostId === state.sessionId,
          );
          this.joinedAt = performance.now();
          this.lastClock = -Infinity;
          this.renewing = false;
          this.flush();
        }
      }
      if (type === "musicEnded") {
        if (!this.renewing) this.end(state.error || "Host disconnected");
        return;
      }
      if (type === "musicSnapshot" && v?.renewal) {
        this.playback.receive(type, v);
        this.planRenewal(false, v);
        return;
      }
      if (type.startsWith("music")) this.playback.receive(type, v);
      if (["full", "error"].includes(state.status)) {
        if (this.renewing) {
          // Admission and socket routing may briefly disagree during room replacement.
          // Retry the same role/code within the bounded renewal window.
          this.later(() => {
            if (this.renewing && this.client === c) {
              this.client = null;
              c.disconnect();
              void this.attach(create, code).catch((e) => this.end(e.message));
            }
          }, 500);
          return;
        }
        this.status = state.status;
        this.notice(state.error);
      }
      if (state.status === "reconnecting" && !this.renewing) {
        if (this.playback.host) {
          this.end("Host connection lost. Create a fresh room.");
          return;
        }
        this.status = "reconnecting";
        this.audio.cancel();
        this.playback.pending.clear();
        this.playback.clock.ready = false;
      }
      this.emit();
    });
    await c.connect();
    this.emit();
  }
  send(type, data) {
    if (this.client?.state.status === "connected") {
      // Keep each snapshot below both the room's 14 KiB cap and transport's 16 KiB cap.
      // Each chunk is independently mergeable by epoch/event identity.
      if (type === "musicSnapshot" && data.events.length > 56) {
        for (let i = 0; i < data.events.length; i += 56)
          this.client.send(type, {
            ...data,
            events: data.events.slice(i, i + 56),
          });
      } else this.client.send(type, data);
    } else if (this.renewing && type === "musicIntent")
      this.transportQueue.push({ type, data });
  }
  flush() {
    const queued = this.transportQueue.splice(0);
    for (const e of queued) this.send(e.type, e.data);
  }
  tap(sound) {
    return this.playback.tap(sound);
  }
  tick() {
    if (this.closed) return;
    this.playback.tick();
    const now = performance.now();
    if (
      this.status === "connected" &&
      !this.playback.host &&
      !this.renewing &&
      now - this.lastClock > (this.requests < 12 ? 250 : 2000)
    ) {
      this.lastClock = now;
      this.send("musicClockRequest", { request: ++this.requests, sent: now });
    }
    if (
      this.status === "connected" &&
      this.playback.host &&
      !this.renewing &&
      now - this.joinedAt > 240000
    )
      this.planRenewal(true);
    this.emit();
  }
  later(fn, ms) {
    const handle = setTimeout(() => {
      this.timerHandles.delete(handle);
      if (!this.closed) fn();
    }, ms);
    this.timerHandles.add(handle);
  }
  planRenewal(host, signal) {
    if (this.renewing) return;
    this.renewing = true;
    this.renewals++;
    const code = this.code,
      number = this.players.find((p) => p.id === this.playback.id)?.number || 2;
    this.notice("Reconnecting. The clock keeps running.");
    if (host)
      for (const p of this.players)
        if (p.id !== this.playback.id)
          this.send(
            "musicSnapshot",
            this.playback.snapshot(p.id, { renewal: this.renewals, code }),
          );
    // The host's ledger survives; the old relay room is deliberately closed before its 300 s limit.
    this.later(() => {
      const old = this.client;
      this.client = null;
      old?.disconnect();
    }, 1000);
    this.later(
      () =>
        void this.attach(host, signal?.code || code).catch((e) =>
          this.end(e.message),
        ),
      host ? 1700 : 2300 + number * 100,
    );
    this.later(() => {
      if (this.renewing)
        this.end("Relay refresh could not complete. Create a fresh room.");
    }, 20000);
  }
  resume() {
    this.playback.resume();
    if (this.client?.state.status === "connected") this.client.send("snapshot");
    this.emit();
  }
  end(reason) {
    this.status = "ended";
    this.playback.stop();
    this.playback.message = reason;
    const c = this.client;
    this.client = null;
    c?.disconnect();
    this.emit();
  }
  dispose() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.timer);
    for (const handle of this.timerHandles) clearTimeout(handle);
    this.timerHandles.clear();
    document.removeEventListener("visibilitychange", this.visibility);
    this.client?.disconnect();
    this.audio.dispose();
    this.listeners.clear();
  }
}
