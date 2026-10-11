import test from "node:test";
import assert from "node:assert/strict";
import {
  EventLedger,
  ClockSync,
  nextStep,
  circle,
  listenerDeadline,
} from "../src/music/rules.js";
test("exact boundaries target following step; circles wrap independently of event identity", () => {
  assert.equal(nextStep(1230, 0), 3);
  assert.equal(nextStep(1500, 0), 4);
  assert.equal(circle(8), 0);
  assert.equal(circle(14), 6);
});
test("late host acceptance preserves source deadline and each listener has one fixed buffer", () => {
  const l = new EventLedger("e", 0);
  const event = l.accept(
    { epoch: "e", step: 3, origin: "guest", sound: "snare", sequence: 1 },
    2100,
  );
  assert.equal(event.deadline, 1500);
  assert.equal(listenerDeadline(event, "guest"), 1500);
  assert.equal(listenerDeadline(event, "host"), 4500);
  assert.equal(listenerDeadline(event, "other"), 4500);
  assert.equal(
    l.accept({ epoch: "e", step: 3, origin: "guest", sound: "kick" }, 4450),
    null,
  );
});
test("distinct instruments batch, repeats deduplicate, other players and later cycles remain independent", () => {
  const l = new EventLedger("e", 0);
  const intent = { epoch: "e", step: 1, origin: "a", sound: "kick" };
  assert.ok(l.accept(intent, 100));
  assert.equal(l.accept(intent, 200), null);
  assert.ok(l.accept({ ...intent, sound: "snare" }, 200));
  assert.ok(l.accept({ ...intent, origin: "b" }, 200));
  assert.ok(l.accept({ ...intent, step: 9 }, 4100));
  assert.equal(l.pending(4100).length, 1);
  l.prune(13000);
  assert.equal(l.events.size, 0);
});
test("invalid and future events or old epochs cannot enter the host ledger", () => {
  const l = new EventLedger("new", 0);
  const i = { epoch: "new", step: 1, origin: "a", sound: "kick" };
  for (const patch of [
    { epoch: "old" },
    { step: 10 },
    { step: -1 },
    { sound: "boom" },
    { step: NaN },
  ])
    assert.equal(l.accept({ ...i, ...patch }, 100), null);
});
test("clock mapping handles different monotonic origins and rejects poorer jitter samples", () => {
  const c = new ClockSync();
  c.sample({ sent: 100, received: 5200, hostNow: 5205 }, 305);
  assert.equal(c.offset, 5000);
  assert.equal(c.best, 200);
  c.sample({ sent: 500, received: 5600, hostNow: 5610 }, 910);
  assert.equal(c.offset, 5000);
  c.sample({ sent: 1000, received: 6102, hostNow: 6105 }, 1203);
  assert.equal(c.offset, 5002);
});
