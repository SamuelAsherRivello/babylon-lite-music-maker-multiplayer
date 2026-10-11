import test from "node:test";
import assert from "node:assert/strict";
import config from "../../vite.config.js";
import {
  defaultLayout,
  fitViewport,
  validateLayout,
} from "../src/ui/layout.js";
test("Pages assets use the game repository subpath and renamed application root", () => {
  assert.equal(config.root, "music-maker");
  assert.equal(config.base, "/babylon-lite-music-maker-multiplayer/");
});
test("landscape framing stays bounded at desktop, narrow landscape, portrait and fullscreen sizes", () => {
  assert.equal(defaultLayout.orientation, "landscape");
  for (const [w, h] of [
    [1280, 720],
    [844, 390],
    [390, 844],
    [1920, 1080],
  ]) {
    const f = fitViewport(w, h, defaultLayout);
    assert.ok(f.width <= w && f.height <= h);
    assert.equal(f.width / f.height, 16 / 9);
    assert.equal(f.x * 2 + f.width, w);
    assert.equal(f.y * 2 + f.height, h);
  }
  assert.throws(
    () => validateLayout({ ...defaultLayout, width: 0 }),
    /positive/,
  );
});
