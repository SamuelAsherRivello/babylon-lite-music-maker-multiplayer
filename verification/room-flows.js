async (page) => {
  const browser = page.context().browser(),
    pages = browser.contexts().flatMap((c) => c.pages()),
    host = pages.find((p) => p.url().includes("client=host")),
    guest = pages.find((p) => p.url().includes("client=guest"));
  const base = host.url().split("?")[0],
    code = await host.evaluate(() => window.__musicDebug.code),
    extra = [];
  const join = async (label, touch = false, enter = true) => {
    const c = await browser.newContext({
      viewport: { width: touch ? 844 : 1280, height: touch ? 390 : 720 },
      hasTouch: touch,
    });
    extra.push(c);
    const p = await c.newPage();
    await p.goto(
      base +
        "?test=1&mute=true&client=" +
        label +
        (enter ? "&room=" + code : ""),
      {
        waitUntil: "domcontentloaded",
      },
    );
    return p;
  };
  // Load the application before creating a buffered event; shader/module startup
  // is not part of the three-second network buffer under test.
  const third = await join("third", false, false);
  await third.getByRole("button", { name: "Create room →" }).waitFor();
  await host.waitForTimeout(600);
  const buffered = await host.evaluate(() => {
    const s = window.__musicDebug;
    if (!s.tap("tone")) throw Error("Could not create buffered late-join note");
    return s.audio.trace.filter((e) => e.kind === "local").at(-1);
  });
  await host.waitForTimeout(500);
  await third.getByRole("textbox").fill(code);
  await third.getByRole("button", { name: "Join room", exact: true }).click();
  await third.waitForFunction(() => window.__musicDebug?.playback?.active);
  await third.waitForFunction(
    (e) =>
      window.__musicDebug.audio.trace.some(
        (t) =>
          t.kind === "remote" &&
          t.origin === e.origin &&
          t.step === e.step &&
          t.sourceDeadline === e.deadline,
      ),
    buffered,
  );
  const lateJoin = await third.evaluate(
    (e) =>
      window.__musicDebug.audio.trace.find(
        (t) =>
          t.kind === "remote" && t.origin === e.origin && t.step === e.step,
      ),
    buffered,
  );
  if (
    lateJoin.deadline !== buffered.deadline + 3000 ||
    Math.abs(lateJoin.scheduledAt - lateJoin.deadline) > 25
  )
    throw Error("Late-join snapshot changed playback deadline");
  const fourth = await join("fourth", true);
  await fourth.getByRole("button", { name: "Enable sound" }).tap();
  await fourth.waitForFunction(() => window.__musicDebug?.playback?.active);
  await host.waitForFunction(() => window.__musicDebug.players.length === 4);
  const fifth = await join("fifth");
  await fifth.getByRole("heading", { name: "This room is full" }).waitFor();
  await fourth.getByRole("button", { name: "Play Tone" }).tap();
  await host.waitForTimeout(4000);
  const touchTrace = await fourth.evaluate(() =>
    window.__musicDebug.audio.trace.filter((e) => e.kind === "local"),
  );
  if (!touchTrace.some((e) => e.sound === "tone"))
    throw Error("Touch pad did not play");
  await third.waitForFunction(() => window.__musicDebug.view().phase < 0.2);
  const inputBefore = await third.evaluate(
    () => window.__musicDebug.audio.trace.length,
  );
  await third.keyboard.down("1");
  await third.keyboard.down("1");
  await third.keyboard.up("1");
  await third.keyboard.press("2");
  await third.keyboard.press("3");
  const inputTrace = await third.evaluate(
    (n) =>
      window.__musicDebug.audio.trace
        .slice(n)
        .filter((e) => e.kind === "local"),
    inputBefore,
  );
  if (
    inputTrace.length !== 3 ||
    new Set(inputTrace.map((e) => e.step)).size !== 1
  )
    throw Error("Repeated key or mixed pad batching failed");
  const old = await guest.evaluate(() => window.__musicDebug.playback.id);
  await guest.evaluate(() =>
    window.__musicDebug.client.room.connection.close(),
  );
  await guest.waitForFunction(
    (old) =>
      window.__musicDebug.playback.id !== old &&
      window.__musicDebug.status === "connected" &&
      window.__musicDebug.playback.active,
    old,
  );
  const rejoined = await guest.evaluate(() => window.__musicDebug.playback.id);
  // A packet older than the buffer is dropped, independently of arrival quantization.
  const late = await third.evaluate(() => {
    const p = window.__musicDebug.playback,
      before = p.late;
    p.commit({
      epoch: p.epoch,
      origin: "late-packet-probe",
      step: 0,
      sound: "hat",
      sequence: 999,
      deadline: p.time - 4000,
    });
    p.tick();
    return { before, after: p.late };
  });
  if (late.after !== late.before + 1)
    throw Error("Late packet was not dropped");
  await third.evaluate(() => window.__musicDebug.audio.context.suspend());
  await third.getByRole("button", { name: "Enable sound" }).click();
  await third.waitForFunction(() => window.__musicDebug.audio.ready);
  const resumed = await third.evaluate(
    () => window.__musicDebug.playback.pending.size,
  );
  if (resumed > 112) throw Error("Suspension caused backlog");
  const epochReset = await third.evaluate(() => {
    const s = window.__musicDebug,
      original = s.playback.epoch;
    s.playback.setEpoch(crypto.randomUUID(), s.playback.time);
    return {
      original,
      cleared:
        !s.audio.voices.size &&
        !s.playback.pending.size &&
        !s.playback.predictions.size &&
        !s.playback.clock.ready,
    };
  });
  if (!epochReset.cleared) throw Error("Epoch change retained old audio");
  await third.waitForFunction(
    (epoch) =>
      window.__musicDebug.playback.epoch === epoch &&
      window.__musicDebug.playback.active,
    epochReset.original,
  );
  await host.screenshot({ path: "docs/music-maker-four-players.png" });
  await host.evaluate(() => window.__musicDebug.client.room.connection.close());
  await guest.getByRole("heading", { name: "Host disconnected" }).waitFor();
  await third.getByRole("heading", { name: "Host disconnected" }).waitFor();
  const ended = await Promise.all(
    [guest, third, fourth].map((p) =>
      p.evaluate(() => ({
        status: window.__musicDebug.status,
        pending: window.__musicDebug.playback.pending.size,
        voices: window.__musicDebug.audio.voices.size,
      })),
    ),
  );
  if (ended.some((e) => e.status !== "ended" || e.pending || e.voices))
    throw Error("Host loss left active audio");
  for (const c of extra) await c.close();
  return {
    result: "PASS",
    capacity: 4,
    fifthRejected: true,
    oldId: old,
    rejoinedId: rejoined,
    touch: "emulated",
    late,
    ended,
    resumedPending: resumed,
    inputTrace,
    epochReset,
    lateJoin,
  };
}