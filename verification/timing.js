async (page) => {
  const base = page.url().includes("github.io/")
    ? page.url().split("?")[0]
    : "http://127.0.0.1:5410/babylon-lite-music-maker-multiplayer/";
  const browser = page.context().browser();
  for (const c of browser.contexts())
    if (
      c !== page.context() &&
      c.pages().some((p) => p.url().includes("client=guest"))
    )
      await c.close();
  const nativeProtocols = () => {
    window.WebSocket = new Proxy(window.WebSocket, {
      construct(target, args, next) {
        if (args[1] && typeof args[1] === "object" && !Array.isArray(args[1]))
          throw new DOMException("Invalid subprotocol", "SyntaxError");
        return Reflect.construct(target, args, next);
      },
    });
  };
  const errors = [];
  const assetErrors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400)
      assetErrors.push({ url: r.url(), status: r.status() });
  });
  const guestContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    }),
    guest = await guestContext.newPage();
  guest.on("pageerror", (e) => errors.push(e.message));
  guest.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400)
      assetErrors.push({ url: r.url(), status: r.status() });
  });
  for (const context of [page.context(), guestContext]) {
    // The SDK probes Node's object overload first. Playwright's proxy must reject
    // that overload synchronously, like the native browser, so its fallback runs.
    await context.addInitScript(() => {
      window.WebSocket = new Proxy(window.WebSocket, {
        construct(target, args, next) {
          if (args[1] && typeof args[1] === "object" && !Array.isArray(args[1]))
            throw new DOMException("Invalid subprotocol", "SyntaxError");
          return Reflect.construct(target, args, next);
        },
      });
    });
    await context.routeWebSocket(
      (url) => url.hostname.endsWith(".vercel.app"),
      async (socket) => {
        const server = socket.connectToServer();
        let outgoing = 0,
          incoming = 0,
          index = 0;
        socket.onMessage((message) => {
          outgoing = Math.max(
            Date.now() + 250 + ((index++ * 37) % 101),
            outgoing + 1,
          );
          setTimeout(() => {
            try {
              server.send(message);
            } catch {}
          }, outgoing - Date.now());
        });
        server.onMessage((message) => {
          incoming = Math.max(
            Date.now() + 250 + ((index++ * 53) % 101),
            incoming + 1,
          );
          setTimeout(() => {
            try {
              socket.send(message);
            } catch {}
          }, incoming - Date.now());
        });
      },
    );
  }
  await page.goto(base + "?test=1&mute=true&client=host", {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate(nativeProtocols);
  await page.getByRole("button", { name: "Create room →" }).click();
  await page.waitForFunction(
    () =>
      window.__musicDebug?.status === "connected" &&
      window.__musicDebug.playback.active,
  );
  const code = await page.evaluate(() => window.__musicDebug.code);
  await guest.goto(base + "?test=1&mute=true&client=guest", {
    waitUntil: "domcontentloaded",
  });
  await guest.evaluate(nativeProtocols);
  await guest.getByRole("textbox").fill(code);
  await guest.getByRole("button", { name: "Join room", exact: true }).click();
  await guest.waitForFunction(
    () =>
      window.__musicDebug?.playback.active && window.__musicDebug.audio.ready,
  );
  await guest.waitForTimeout(6000);
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press(String((i % 4) + 1));
    await guest.keyboard.press(String(((i + 1) % 4) + 1));
    if (i === 2) {
      await guest.keyboard.press("1");
      await guest.keyboard.press("3");
    }
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(3500);
  const data = await Promise.all(
    [page, guest].map((p) =>
      p.evaluate(() => {
        const s = window.__musicDebug;
        return {
          id: s.playback.id,
          epoch: s.playback.epoch,
          step: s.view().step,
          clockOffset: s.playback.clock.offset,
          timeOrigin: performance.timeOrigin,
          trace: s.audio.trace,
          late: s.playback.late,
          visibility: document.visibilityState,
          roster: s.players,
          status: s.status,
        };
      }),
    ),
  );
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  for (const d of data) {
    assert(d.status === "connected", "connected after ten cycles");
    assert(d.visibility === "visible", "foreground context");
    const sounds = d.trace.filter((e) => e.kind !== "metronome");
    assert(
      sounds.some((e) => e.kind === "local") &&
        sounds.some((e) => e.kind === "remote"),
      "both local and remote audio",
    );
    assert(
      new Set(sounds.map((e) => e.key)).size === sounds.length,
      "no echoes",
    );
    for (const e of sounds) {
      assert(
        Math.abs(e.scheduledAt - e.deadline) <= 25,
        "audio scheduling <=25ms",
      );
      assert(
        e.deadline - e.sourceDeadline === (e.kind === "local" ? 0 : 3000),
        "fixed remote +3000ms",
      );
    }
  }
  const host = data[0],
    g = data[1],
    clockError = g.clockOffset - (g.timeOrigin - host.timeOrigin);
  assert(
    Math.abs(clockError) <= 25,
    "mapped clock offset error <=25ms: " + clockError,
  );
  const mappedErrors = data.map((d, i) =>
    Math.max(
      ...d.trace
        .filter((e) => e.kind !== "metronome")
        .map((e) =>
          Math.abs(
            e.audioClockSample.performanceTime +
              (e.audioTime - e.audioClockSample.contextTime) * 1000 +
              (i ? g.timeOrigin - host.timeOrigin : 0) -
              e.deadline,
          ),
        ),
    ),
  );
  assert(
    mappedErrors.every((e) => e <= 25),
    "mapped AudioContext start error <=25ms: " + mappedErrors,
  );
  assert(Math.abs(host.step - g.step) <= 1, "shared live cursor");
  assert(errors.length === 0, "browser errors: " + errors.join(","));
  assert(
    assetErrors.length === 0,
    "asset errors: " + JSON.stringify(assetErrors),
  );
  await page.screenshot({ path: "docs/music-maker-desktop.png" });
  await guest.screenshot({ path: "artifacts/guest.png" });
  return {
    result: "PASS",
    base,
    delayPerLeg: "250ms + 0–100ms ordered jitter",
    cycles: 10,
    clockError,
    mappedErrors,
    clients: data,
    errors,
    assetErrors,
  };
}