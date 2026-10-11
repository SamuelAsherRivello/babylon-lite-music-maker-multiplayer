async (page) => {
  const players = page
    .context()
    .browser()
    .contexts()
    .flatMap((c) => c.pages())
    .filter((p) => /client=(host|guest)/.test(p.url()));
  const clients = await Promise.all(
    players.map((p) =>
      p.evaluate(() => {
        const s = window.__musicDebug,
          v = window.__durationProbe;
        return {
          elapsedMs: performance.now() - v.started,
          epoch: s.playback.epoch,
          sameEpoch:
            s.playback.epoch === v.epoch && s.playback.start === v.start,
          renewals: s.renewals,
          renewalsDuringProbe: s.renewals - v.baselineRenewals,
          status: s.status,
          endpoint: s.client?.endpoint,
          transportStates: window.__transportStates || [],
          errors: v.errors,
          heard: v.heard,
          late: s.playback.late,
          samples: v.samples,
          roster: s.players,
        };
      }),
    ),
  );
  for (const c of clients) {
    if (
      c.elapsedMs <= 600000 ||
      !c.sameEpoch ||
      c.renewalsDuringProbe < 2 ||
      c.status !== "connected" ||
      c.errors.length ||
      c.heard.local < 250 ||
      c.heard.remote < 250
    )
      throw Error("Duration acceptance failed: " + JSON.stringify(c));
  }
  for (const p of players)
    await p.evaluate(() => clearInterval(window.__durationProbe.timer));
  return { result: "PASS", clients, physicalSpeakerLatency: "not measured" };
}
