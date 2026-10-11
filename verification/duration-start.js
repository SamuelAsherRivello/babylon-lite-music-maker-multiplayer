async (page) => {
  const pages = page
      .context()
      .browser()
      .contexts()
      .flatMap((c) => c.pages()),
    players = pages.filter((p) => /client=(host|guest)/.test(p.url()));
  if (players.length !== 2) throw Error("Exactly two music clients required");
  for (const p of players)
    await p.evaluate(() => {
      const s = window.__musicDebug;
      clearInterval(window.__durationProbe?.timer);
      const probe = (window.__durationProbe = {
        started: performance.now(),
        epoch: s.playback.epoch,
        start: s.playback.start,
        baselineRenewals: s.renewals,
        samples: [],
        errors: [],
        heard: { local: 0, remote: 0 },
        seen: new Set(s.audio.trace.filter(e=>e.key).map(e=>e.key)),
        lastStep: s.view().step,
      });
      let tick = 0;
      probe.timer = setInterval(() => {
        const v = s.view();
        if (v.status !== "connected") probe.errors.push(v.status);
        if (s.playback.epoch !== probe.epoch)
          probe.errors.push("epoch changed");
        if (v.step < probe.lastStep) probe.errors.push("clock moved backwards");
        probe.lastStep = v.step;
        for (const e of s.audio.trace)
          if (e.key && !probe.seen.has(e.key)) {
            probe.seen.add(e.key);
            probe.heard[e.kind]++;
          }
        probe.samples.push({
          elapsed: performance.now() - probe.started,
          step: v.step,
          renewals: s.renewals,
          status: v.status,
          late: s.playback.late,
        });
        s.tap(["kick", "snare", "hat", "tone"][tick++ % 4]);
        if (performance.now() - probe.started > 660000)
          clearInterval(probe.timer);
      }, 2000);
    });
  return {
    result: "STARTED",
    clients: 2,
    durationTargetSeconds: 640,
    transport: "public Vercel free relay with injected latency/jitter",
  };
}
