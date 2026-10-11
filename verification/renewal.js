async (page) => {
  const pages = page
    .context()
    .browser()
    .contexts()
    .flatMap((c) => c.pages());
  const host = pages.find((p) => p.url().includes("client=host")),
    guest = pages.find((p) => p.url().includes("client=guest"));
  const baseline = await host.evaluate(() => ({
    epoch: window.__musicDebug.playback.epoch,
    start: window.__musicDebug.playback.start,
    joined: window.__musicDebug.joinedAt,
    renewals: window.__musicDebug.renewals,
  }));
  await host.evaluate(
    () => (window.__musicDebug.joinedAt = performance.now() - 239000),
  );
  await host.waitForTimeout(6000);
  for (const p of [host, guest])
    await p.waitForFunction(
      (previous) =>
        window.__musicDebug.status === "connected" &&
        !window.__musicDebug.renewing &&
        window.__musicDebug.renewals > previous,
      baseline.renewals,
    );
  await host.keyboard.press("1");
  await guest.keyboard.press("2");
  await host.waitForTimeout(4000);
  const result = await Promise.all(
    [host, guest].map((p) =>
      p.evaluate(() => ({
        status: window.__musicDebug.status,
        epoch: window.__musicDebug.playback.epoch,
        start: window.__musicDebug.playback.start,
        renewals: window.__musicDebug.renewals,
        step: window.__musicDebug.view().step,
        roster: window.__musicDebug.players,
        trace: window.__musicDebug.audio.trace
          .filter((e) => e.kind !== "metronome")
          .slice(-4),
      })),
    ),
  );
  if (
    result.some(
      (r) =>
        r.status !== "connected" ||
        r.renewals <= baseline.renewals ||
        r.epoch !== baseline.epoch ||
        r.start !== baseline.start,
    )
  )
    throw Error("Renewal lost musical authority");
  return {
    result: "PASS",
    test: "accelerated planned transport renewal; not a ten-minute duration claim",
    baseline,
    clients: result,
  };
}