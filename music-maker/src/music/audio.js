/** Audio scheduling is independent from frames and transport. No remote audio is streamed. */
export class MusicAudio {
  constructor() {
    this.context = null;
    this.voices = new Set();
    this.trace = [];
    this.muted = new URLSearchParams(location.search).get("mute") === "true";
  }
  async enable() {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: "interactive" });
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.setMuted(this.muted);
    }
    await this.context.resume();
  }
  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.6;
  }
  get ready() {
    return this.context?.state === "running";
  }
  play(sound, canonicalDeadline, canonicalNow, info = {}) {
    if (!this.ready) return false;
    const ctx = this.context;
    const delay = canonicalDeadline - canonicalNow;
    if (delay < -25) return false;
    const at = ctx.currentTime + Math.max(0, delay) / 1000;
    const audioClockSample = {
      contextTime: ctx.currentTime,
      performanceTime: performance.now(),
    };
    const gain = ctx.createGain();
    gain.connect(this.master);
    const duration =
      sound === "tone"
        ? 0.25
        : sound === "kick"
          ? 0.18
          : sound === "snare"
            ? 0.14
            : 0.055;
    gain.gain.setValueAtTime(
      sound === "beep" ? 0.045 : sound === "hat" ? 0.12 : 0.32,
      at,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    let source;
    if (sound === "hat" || sound === "snare") {
      const buffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * duration),
        ctx.sampleRate,
      );
      const channel = buffer.getChannelData(0);
      let seed = sound === "hat" ? 733 : 551;
      for (let i = 0; i < channel.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        channel[i] = seed / 2147483648 - 1;
      }
      source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = sound === "hat" ? 7000 : 1200;
      source.connect(filter);
      filter.connect(gain);
    } else {
      source = ctx.createOscillator();
      source.type = sound === "tone" ? "triangle" : "sine";
      source.frequency.setValueAtTime(
        sound === "kick" ? 130 : sound === "tone" ? 440 : 880,
        at,
      );
      if (sound === "kick")
        source.frequency.exponentialRampToValueAtTime(38, at + duration);
      source.connect(gain);
    }
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(at);
    source.stop(at + duration + 0.01);
    this.trace.push({
      ...info,
      sound,
      deadline: canonicalDeadline,
      scheduledAt: canonicalNow + Math.max(0, delay),
      audioTime: at,
      audioClockSample,
      recordedAt: performance.now(),
    });
    if (this.trace.length > 1024)
      this.trace.splice(0, this.trace.length - 1024);
    return true;
  }
  cancel() {
    for (const source of this.voices) {
      try {
        source.stop();
      } catch {}
    }
    this.voices.clear();
  }
  dispose() {
    this.cancel();
    void this.context?.close();
  }
}
