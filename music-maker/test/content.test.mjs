import test from "node:test";
import assert from "node:assert/strict";
import {
  BabylonLiteAIEntry as Entry,
  BabylonLiteMode,
  snapPositionPxThroughView,
} from "../src/content/babylon/pixel-grid-entry.js";
import { sprite2DWorldToScreenToRef } from "@babylonjs/lite";
import { getInitializationMessage } from "../src/content/babylon/initialization.js";
test("fractional simulation positions project to integer screen pixels through the camera view", () => {
  for (const view of [
    { positionPx: [0.5, -0.25], zoom: 1, rotation: 0 },
    { positionPx: [-0.75, 0.2], zoom: 2, rotation: 0 },
  ]) {
    const p = snapPositionPxThroughView(view, [13.42, -7.65]);
    const screen = sprite2DWorldToScreenToRef(view, ...p, { x: 0, y: 0 });
    assert.ok(Number.isInteger(screen.x) && Number.isInteger(screen.y));
    assert.deepEqual(snapPositionPxThroughView(view, p), p);
  }
});
test("pixel mode is explicit and invalid camera mutations are rejected", () => {
  assert.throws(() => Entry.configure({ mode: "3d" }), /Unsupported/);
  Entry.configure({ mode: BabylonLiteMode.PixelPerfect2D });
  const layer = { view: { positionPx: [0, 0], zoom: 1, rotation: 0 } };
  Entry.updateView(layer, { positionPx: [320, 180], zoom: 1 });
  assert.deepEqual(layer.view.positionPx, [320, 180]);
  assert.throws(
    () => Entry.updateView(layer, { offset: [1, 2] }),
    /Unsupported/,
  );
});
test("unsupported WebGPU and allocation errors produce actionable messages", () => {
  assert.match(getInitializationMessage(false), /requires WebGPU/);
  assert.match(
    getInitializationMessage(true, Error("device lost")),
    /allocate/,
  );
});
