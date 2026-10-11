import test from "node:test";
import assert from "node:assert/strict";
import { MusicSession } from "../src/music/session.js";

test("planned renewal preserves host authority, queues guest input, and unexpected host loss ends audio", async () => {
  const previous = {
    document: globalThis.document,
    location: globalThis.location,
    window: globalThis.window,
  };
  globalThis.document = {
    addEventListener() {},
    removeEventListener() {},
    hidden: false,
  };
  globalThis.location = { search: "" };
  globalThis.window = {};
  const sessions = [];
  try {
    let serial = 0;
    const sent = [];
    class FakeClient {
      constructor(endpoint, game, options) {
        this.options = options;
        this.state = { status: "idle" };
        this.listeners = [];
        this.id = "id" + ++serial;
      }
      subscribe(fn) {
        this.listeners.push(fn);
      }
      emit(type) {
        for (const fn of this.listeners) fn(this.state, type);
      }
      async connect() {
        this.state = {
          status: "connected",
          code: this.options.code || "AB12",
          sessionId: this.id,
          hostId: this.options.create ? this.id : "host",
          players: [
            {
              id: this.id,
              number: this.options.create ? 1 : 2,
              host: !!this.options.create,
            },
          ],
        };
        this.emit("snapshot");
      }
      send(type, data) {
        sent.push({ type, data });
      }
      disconnect() {
        this.state.status = "offline";
        this.emit("status");
      }
    }
    function session() {
      const s = new MusicSession();
      sessions.push(s);
      clearInterval(s.timer);
      s.Client = FakeClient;
      s.audio = {
        ready: true,
        play: () => true,
        cancel() {
          this.cancelled = true;
        },
        dispose() {},
      };
      s.playback.audio = s.audio;
      return s;
    }
    const host = session();
    await host.attach(true, "AB12");
    host.tap("kick");
    const epoch = host.playback.epoch,
      start = host.playback.start,
      ledger = host.playback.ledger,
      oldId = host.playback.id;
    const dense = {
      target: "123456789",
      epoch,
      start,
      hostNow: 12345678.23456789,
      sequence: 112,
      events: Array.from({ length: 112 }, (_, i) => ({
        epoch,
        origin: "123456789",
        step: 10000 + i,
        sequence: 10000 + i,
        sound: "snare",
        deadline: 12345678.23456789,
      })),
    };
    assert.ok(Buffer.byteLength(JSON.stringify(dense)) > 14336);
    const before = sent.length;
    host.send("musicSnapshot", dense);
    const packets = sent.slice(before).map((e) => e.data);
    assert.ok(packets.length > 1);
    assert.deepEqual(
      packets.flatMap((p) => p.events),
      dense.events,
    );
    assert.ok(
      packets.every((p) => Buffer.byteLength(JSON.stringify(p)) < 14336),
    );
    const callbacks = [];
    host.later = (fn, ms) => callbacks.push({ fn, ms });
    host.planRenewal(true);
    callbacks.find((c) => c.ms === 1000).fn();
    callbacks.find((c) => c.ms === 1700).fn();
    await Promise.resolve();
    assert.equal(host.playback.epoch, epoch);
    assert.equal(host.playback.start, start);
    assert.equal(host.playback.ledger, ledger);
    assert.equal(host.renewing, false);
    assert.notEqual(host.playback.id, oldId);
    assert.ok(host.playback.origins.has(oldId));
    const guest = session();
    await guest.attach(false, "AB12");
    guest.renewing = true;
    guest.client = null;
    guest.send("musicIntent", { sequence: 1 });
    assert.equal(guest.transportQueue.length, 1);
    await guest.attach(false, "AB12");
    assert.equal(guest.transportQueue.length, 0);
    assert.ok(
      sent.some((e) => e.type === "musicIntent" && e.data.sequence === 1),
    );
    const retries = [];
    guest.later = (fn, ms) => retries.push({ fn, ms });
    guest.renewing = true;
    guest.client.state.status = "error";
    guest.client.state.error = "Room expired or code not found";
    guest.client.emit("status");
    assert.equal(retries[0].ms, 500);
    retries[0].fn();
    await Promise.resolve();
    assert.equal(guest.client.options.create, undefined);
    assert.equal(guest.client.options.code, "AB12");
    assert.equal(guest.renewing, false);
    host.client.state.status = "reconnecting";
    host.client.emit("status");
    assert.equal(host.status, "ended");
    assert.equal(host.playback.active, false);
    assert.equal(host.audio.cancelled, true);
  } finally {
    sessions.forEach((s) => s.dispose());
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete globalThis[k];
      else globalThis[k] = v;
    }
  }
});
