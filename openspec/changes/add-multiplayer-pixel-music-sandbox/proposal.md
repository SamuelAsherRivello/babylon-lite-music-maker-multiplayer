# Proposal

## Why

Build a small, complete cooperative music sandbox where up to four people tap sounds into a repeating eight-step clock. Next-step local playback and a three-second remote buffer make the interaction responsive while allowing network messages time to arrive.

## What Changes

- Establish Music Maker Multiplayer from the required GitHub repository template, retaining its React shell, Babylon Lite pixel-perfect rendering, corner roles, version convention, and eventual GitHub Pages delivery.
- Replace the sample dungeon brief and showcase with a landscape, fixed-screen music interface: numbered server-generated player names at left, eight blue pulsing circles across the middle, and four local sound pads below.
- Start the clock on room creation; advance every 500 ms and repeat every four seconds. All players have kick, snare, hi-hat, and synth tone. Each distinct sound queues once for the next step and plays once.
- Extend the shared Colyseus backend additively with a private four-seat music relay room. The creator's browser simulates the session; the server owns admission, identity, transport validation, and host-message permissions, not musical simulation.
- Specify absolute event steps, host clock synchronization, immediate local scheduling, remote playback exactly 3,000 ms after the originating step, deduplication, and bounded recovery. The latest per-origin playback clarification takes precedence over the earlier host-only audio lead interpretation.
- Verify local/remote timing with two independent browsers, latency and jitter, and four-seat integration coverage. Gate future public delivery on actual WebSocket and long-session evidence.
- Include a populated build brief and UI sketch in this change. The user authorized the follow-on apply phase, backend/game releases, GitHub Pages deployment and local/public browser verification.

Out of scope: combat, movement, scrolling worlds, scores, victory/defeat, recording, saved patterns, repeating notes, configurable tempo, accounts, and unrelated server refactoring. Host loss ends the session, cancels queued audio and shows Host disconnected with create/join actions. No migration or host reconnect grace.

## Capabilities

### New Capabilities

- `music-room-session`: Private room entry, four server-assigned identities, host authority, additive relay isolation, and truthful connection states.
- `quantized-music-playback`: Continuous eight-step clock, next-step local one-shots, distinct-pad batching, three-second remote events, and audio recovery.
- `pixel-music-interface`: Pixel-perfect landscape presentation, roster, timeline, sound pads, audio activation, and accessible controls.

### Modified Capabilities

None. This project has no existing accepted specifications. Shared-server changes are additive and must preserve all existing consumers; its own planning workflow must be checked when apply is authorized.

## Impact

Target client: this currently empty, non-Git workspace; proposed future source directory `music-maker/`, root npm/Vite configuration, documentation, and release workflows. Backend: `SamuelAsherRivello/rmc-colyseus-multiplayer-server`, particularly `multiplayer-server/src/server.ts`, a new isolated music room, shared-client `index.js`, tests, registry, README, and live deployment probes. Reuse existing code-link/admission utilities and host-relay patterns without importing another game's simulation or automatic host migration.

Inspected template uses React 19.3, Vite 8, Babylon Lite 1.32.0; inspected shared-server/client manifests are 0.9.9 and SDK 0.17.43. These are source observations, not a claim of compatible published releases. Exact source commits and released package URLs must be pinned during apply. Design documents the hosting limits, OpenSpec version mismatch, timing interpretation, and remaining implementation gates.
