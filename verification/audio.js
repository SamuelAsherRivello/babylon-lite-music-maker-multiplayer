async (page) => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const { MusicAudio } =
      await import("/babylon-lite-music-maker-multiplayer/src/music/audio.js");
    window.__audioCheck = new MusicAudio();
    const button = document.createElement("button");
    button.textContent = "Activate audio verification";
    button.style.cssText = "position:fixed;z-index:99;top:0;left:0";
    button.onclick = () => window.__audioCheck.enable();
    document.body.append(button);
  });
  await page
    .getByRole("button", { name: "Activate audio verification" })
    .click();
  await page.waitForFunction(() => window.__audioCheck.ready);
  const scheduled = await page.evaluate(() => {
    const a = window.__audioCheck;
    a.setMuted(true);
    const now = performance.now();
    for (const [i, sound] of ["kick", "snare", "hat", "tone", "beep"].entries())
      a.play(sound, now + 100 + i * 500, now, { kind: "verification" });
    return {
      trace: a.trace,
      muted: a.muted,
      gain: a.master.gain.value,
      contextState: a.context.state,
      sampleRate: a.context.sampleRate,
      baseLatency: a.context.baseLatency,
    };
  });
  await page.waitForTimeout(2600);
  const cleanup = await page.evaluate(async () => {
    const a = window.__audioCheck,
      voices = a.voices.size;
    await a.context.suspend();
    const blocked = a.play("kick", performance.now() + 100, performance.now());
    await a.enable();
    const stale = a.play("kick", performance.now() - 1000, performance.now());
    a.dispose();
    document.querySelector("body > button")?.remove();
    return { voices, blocked, stale };
  });
  if (
    cleanup.voices !== 0 ||
    cleanup.blocked ||
    cleanup.stale ||
    scheduled.gain !== 0
  )
    throw Error("Audio lifecycle or mute failure");
  return {
    result: "PASS",
    scheduled,
    cleanup,
    physicalOutput: "not measured; muted verification",
  };
}
