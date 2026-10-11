async (page) => {
  const browser = page.context().browser(),
    base = "http://127.0.0.1:5410/babylon-lite-music-maker-multiplayer/";
  const c = await browser.newContext({
      viewport: { width: 844, height: 390 },
      deviceScaleFactor: 2,
      hasTouch: true,
    }),
    p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base, { waitUntil: "domcontentloaded" });
  await p.getByRole("button", { name: "Create room →" }).waitFor();
  await p.waitForFunction(() => !document.querySelector(".primary").disabled);
  const initial = await p.evaluate(() => ({
    backing: [
      document.querySelector("canvas").width,
      document.querySelector("canvas").height,
    ],
    dpr: devicePixelRatio,
    stage: document.querySelector(".stage").getBoundingClientRect().toJSON(),
  }));
  if (initial.backing.join() !== "640,360")
    throw Error("DPR changed logical raster");
  await p.getByRole("button", { name: "⚙ Settings" }).tap();
  await p.getByRole("button", { name: "Toggle fullscreen" }).click();
  await p.waitForTimeout(300);
  const full = await p.evaluate(() => ({
    fullscreen: !!document.fullscreenElement,
    stage: document.querySelector(".stage").getBoundingClientRect().toJSON(),
    height: innerHeight,
    width: innerWidth,
  }));
  if (
    !full.fullscreen ||
    full.stage.bottom > full.height + 1 ||
    full.stage.right > full.width + 1
  )
    throw Error("Fullscreen controls cropped");
  await p.screenshot({ path: "artifacts/fullscreen.png" });
  await p.evaluate(() => document.exitFullscreen());
  await p.getByRole("button", { name: "Close", exact: true }).click();
  await p.screenshot({ path: "artifacts/narrow.png" });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(200);
  if (!(await p.locator(".rotate-hint").isVisible()))
    throw Error("Portrait orientation hint missing");
  await p.screenshot({ path: "artifacts/portrait.png" });
  const unsupported = await browser.newContext(),
    u = await unsupported.newPage();
  await u.addInitScript(() =>
    Object.defineProperty(navigator, "gpu", { value: undefined }),
  );
  await u.goto(base, { waitUntil: "domcontentloaded" });
  await u.getByRole("alert").waitFor();
  if (
    !(await u
      .getByRole("alert")
      .innerText()
      .then((t) => t.includes("requires WebGPU")))
  )
    throw Error("Unsupported WebGPU not explained");
  await u.screenshot({ path: "artifacts/unsupported.png" });
  const result = {
    result: "PASS",
    initial,
    full,
    errors,
    touch: "emulated",
    unsupported: "injected missing capability",
  };
  await unsupported.close();
  await c.close();
  return result;
}
