import test from "node:test";
import assert from "node:assert/strict";
import { Playback } from "../src/music/playback.js";
function setup() {
  let now = 10000;
  const trace = [],
    sent = [];
  const p = new Playback({
    audio: {
      ready: true,
      play: (sound, deadline, at, info) => {
        trace.push({ sound, deadline, at, ...info });
        return deadline >= at - 25;
      },
      cancel: () => {},
    },
    now: () => now,
    send: (type, data) => sent.push({ type, data }),
  });
  p.identify("host", true);
  return { p, trace, sent, setTime: (v) => (now = v) };
}
test("origin plays before transport, identical taps collapse, mixed pads combine, commit never echoes", () => {
  const { p, trace, sent } = setup();
  assert.equal(p.tap("kick"), true);
  assert.equal(p.tap("kick"), false);
  p.tap("hat");
  assert.deepEqual(
    trace.map((e) => e.deadline),
    [10500, 10500],
  );
  assert.equal(sent.filter((e) => e.type === "musicCommit").length, 2);
  for (const e of sent) p.receive(e.type, e.data);
  assert.equal(trace.length, 2);
});
test("host hearing guest schedules original deadline +3000, duplicate and delayed arrival cannot move deadline", () => {
  const { p, trace, setTime } = setup();
  p.receive("musicIntent", {
    epoch: p.epoch,
    origin: "guest",
    sequence: 1,
    step: 1,
    sound: "tone",
  });
  setTime(13390);
  p.tick();
  const e = trace.find((e) => e.kind === "remote");
  assert.equal(e.deadline, 13500);
  assert.equal(e.sourceDeadline, 10500);
  p.commit({ ...e, epoch: p.epoch });
  p.tick();
  assert.equal(trace.filter((e) => e.kind === "remote").length, 1);
});
test("stale remote packets drop, epoch reset discards old queue, resume emits no backlog", () => {
  const { p, trace, setTime } = setup();
  setTime(15000);
  p.commit({
    epoch: p.epoch,
    origin: "guest",
    sequence: 1,
    step: 1,
    sound: "kick",
    deadline: 10500,
  });
  assert.equal(p.late, 1);
  p.commit({
    epoch: p.epoch,
    origin: "guest",
    sequence: 2,
    step: 8,
    sound: "hat",
    deadline: 14000,
  });
  p.setEpoch("fresh", 15000);
  assert.equal(p.pending.size, 0);
  p.resume();
  p.tick();
  assert.equal(trace.length, 0);
});
test("guest predictions use synchronized host clock without waiting for acceptance", () => {
  const { p, trace, sent } = setup();
  p.host = false;
  p.epoch = "";
  p.ledger = null;
  p.id = "guest";
  p.origins = new Set(["guest"]);
  p.receive("musicClockReply", {
    sent: 9980,
    received: 14990,
    hostNow: 14990,
    epoch: "room",
    start: 14000,
  });
  p.tap("snare");
  assert.equal(trace[0].deadline, 15500);
  assert.equal(sent[0].type, "musicIntent");
  assert.equal(trace[0].kind, "local");
});

test("unlock can resnapshot future notes without duplicating already scheduled notes", () => {
  const { p, trace, setTime } = setup();
  const event = {
    epoch: p.epoch,
    origin: "friend",
    step: 1,
    sequence: 1,
    sound: "tone",
    deadline: 10500,
  };
  p.audio.ready = false;
  p.commit(event);
  setTime(13400);
  p.tick();
  assert.equal(p.pending.size, 1);
  assert.equal(trace.length, 0);
  p.audio.ready = true;
  p.resume();
  p.commit(event);
  p.tick();
  assert.equal(trace.filter((e) => e.kind === "remote").length, 1);
  p.resume();
  p.commit(event);
  p.tick();
  assert.equal(trace.filter((e) => e.kind === "remote").length, 1);
});
