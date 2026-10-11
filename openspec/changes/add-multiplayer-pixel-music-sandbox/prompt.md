# Populated Game Brief and UI Sketch

This is a clarified build brief, not a verbatim original prompt. Confirmed interview decisions are reflected below; proposed technical/presentation choices and deferred items are labeled. Preserve the actual initial request and consequential follow-ups separately in the eventual README.

- **Title:** Music Maker Multiplayer (proposed replacement for the unrelated Enter the Gungeon Clone sample title).
- **Type:** Online cooperative music sandbox for up to four human players. The host can play alone while waiting for guests. No score, enemies or win condition.
- **World and camera:** One fixed landscape 16:9 screen, proposed 640x360 logical pixel stage. Eight circles run horizontally across the central play area, with a four-slot roster on the left and four sound pads below. Fixed orthographic camera; no character movement or world scrolling.
- **Core loop:** On room creation, start an endlessly repeating eight-step clock. Every 0.5 seconds, the active circle briefly grows, changes from blue to bright blue, and emits a short quiet beep when audio is enabled. A full cycle takes four seconds. These are eight timeline steps, not eight musical bars.
- **Controls:** Click/tap sound pads or use keys 1–4 (proposed shortcuts). Kick, snare, hi-hat and synth tone are available to everyone. Provide visible queued feedback. Holding a key does not retrigger.
- **Sound behavior:** Each tap targets the next step. Each distinct instrument can play once per player on that step; repeated taps of one instrument collapse, while multiple different instruments combine. Sounds play once and do not form a repeating recorded pattern.
- **Local and remote playback:** The origin hears its sound on the very next step without a network round trip. Every other listener hears that event exactly three seconds after that original step deadline. This also applies when a guest taps and the host listens. Preserve source step identity across repeated cycles; do not delay again at each network hop or quantize by arrival time. Each listener therefore hears their own contribution ahead of others' contributions.
- **Cooperative mechanics:** Create or join a private room by code, copy an invite, and hot-join the running timeline. The relay server assigns player numbers, generated names and distinct colors. Show local player, host, occupancy and empty seats. No ready-up or lobby countdown.
- **Look and feel:** Original abstract pixel artwork, dark navy backdrop, restrained blue clock accents, readable pixel typography and bright queued pads. Keep sound activation, mute, connection state and room controls easy to find. The confirmed separate remote marker explains the buffered source step on the same eight-circle line.
- **Gameplay requirements:** A complete first version consists of room entry, continuously repeating clock, four working one-shot pads per player, local feedback, remote buffered playback, guest departure/rejoin, local audio activation/mute, and clear errors. No progression, combat, upgrades, musical editor, recording, saved composition or adjustable tempo.
- **Multiplayer server:** Use https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server. Extend it additively for a private four-seat `music-maker` room. Host browser owns musical simulation, timing and accepted events; server only relays and enforces admission, identity, message bounds and publication permissions. Reuse the shared multiplayer client, private codes and lifecycle features, adding versioned music messages where needed.
- **Smoothness:** Synchronize monotonic host time; schedule audio with Web Audio rather than frame timers. Locally predict next-step sounds and reconcile event identity without replaying them. Send bounded event messages instead of audio streams or high-frequency full snapshots. Drop events arriving beyond the buffer with clear status. Never emit a backlog burst after suspension.
- **Verification:** Two independent foreground browser clients under injected delay/jitter; host and guest-origin sounds; measured next-step local starts and fixed +3,000 ms remote targets; duplicate and wrap handling; four-player capacity; isolation; late join; guest reconnect; mute and autoplay; fullscreen and touch; unsupported WebGPU. Public delivery additionally requires real WSS probes and a session longer than ten minutes across a hosting renewal boundary.
- **Inspiration links/screenshots:** None needed. The dungeon example supplied structure only and contributes no artwork or mechanics.
- **Originality:** Original pixel elements and synthesized sounds. No copied game art, characters, weapons, UI or levels.
- **Host loss and delivery:** End the session, cancel pending audio, show Host disconnected and offer create/join again. No migration or host reconnect grace. Implement, release and publish with local/public Playwright verification. Title, resolution and software timing tolerance remain reviewable implementation choices.

## Proposed UI Sketch

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ MUSIC MAKER MULTIPLAYER                       [Repository]  Room AB7K       │
│                                                   [Copy invite] [Leave]    │
├───────────────────┬────────────────────────────────────────────────────────┤
│ PLAYERS · 2/4     │                 EIGHT-STEP CLOCK                       │
│                   │                                                        │
│ 1  Blue Otter     │       ○ ── ● ── ○ ── ◎ ── ○ ── ○ ── ○ ── ○            │
│    You · Host     │       1    2    3    4    5    6    7    8               │
│                   │                                                        │
│ 2  Neon Finch     │       ● Live step      ◎ Remote playback source        │
│    Connected      │       0.5 sec per step · 4 sec per cycle                │
│                   │                                                        │
│ 3  Empty          │                    YOUR SOUNDS                         │
│                   │                                                        │
│ 4  Empty          │      [ KICK ]  [ SNARE ]  [ HI-HAT ]  [ TONE ]          │
│                   │         1          2          3          4             │
│                   │                                                        │
│                   │          Queued for step 3: Kick + Snare               │
├───────────────────┴────────────────────────────────────────────────────────┤
│ [Settings · Mute ☐]     You: next step · Others hear you 3 sec later  vX.Y.Z │
└────────────────────────────────────────────────────────────────────────────┘
```

The remote marker is six steps behind the live cursor and follows source event identity; it is inactive while the first three seconds of history fill. The sketch shows live circle 2 and remote source circle 4 after wrap. Both markers use different shapes and labels as well as color. Only the live circle drives the ordinary metronome beep. When browser audio is blocked, show an Enable Sound control in the play area. Connection/late-event messages occupy a small status line without displacing the four pads.

Entry surface: title, Play Online, editable four-character room code, Create Room and Join Room. A valid room URL auto-joins. Keep all primary controls inside the template viewport rather than its disappearing fullscreen gutters.
