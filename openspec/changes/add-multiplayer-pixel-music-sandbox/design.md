# Design

## Context

See proposal.md for scope. The workspace initially contained no files or Git history. OpenSpec was initialized here with user authorization; there are no accepted specs. No client/backend code has been copied, changed, or run.

Read-only GitHub inspection on 2026-10-10 established:

| Source | Observed facts and evidence |
| --- | --- |
| `SamuelAsherRivello/github-repository-template` (default `main`) | Root npm scripts; Vite application in `project-name/`; React shell with content integration, gutters, four UI corners, version.txt release convention. Babylon Lite 1.32.0, WebGPU only. `main.jsx` composes Content into App. |
| Template AGENTS/checklist and layout guide | Rename application directory; select one orientation; initialize BabylonLiteAIEntry in PixelPerfect2D; use its sprite/view API. Primary React HUD must remain within the viewport for fullscreen. |
| `SamuelAsherRivello/rmc-colyseus-multiplayer-server` (default `main`) | Manifest/server/shared-client source version 0.9.9; server under `multiplayer-server/`; Node 24; typecheck/test/check:docs scripts. Current source includes private codes, 4-seat game rooms, identity/roster and generic gameState messages. |
| Server `src/server.ts` | Game map and `/api/join/:game`; private coded admission currently explicitly lists selected game keys. New music key needs registration in admission, recovery detection, rate-limited code attempts, and room definitions; adding only a room class is insufficient. |
| Server `src/just-like-rabbits-room.ts` and `participant-host-relay.ts` | Concrete precedent for host-owned simulation, relay actions, bounded snapshots, generated names/colors/numbers, heartbeat and host-only publish validation. The helper automatically elects replacements; music must instead end on host loss. |
| Shared client `multiplayer-server/packages/client/index.js` | Actual implementation is JavaScript, not `src/index.ts`. Exposes subscribe/send/disconnect, coded options, generic gameState, hostId and room links. Action reception is currently specialized to habitatAction; heartbeats and SDK recovery are game-key gated. Add optional music support without changing existing defaults. |
| Server README and Release workflow | Active release stages and verifies Vercel then promotes its stable alias and publishes tarball. Rooms/recovery are process-local; four-minute probe is inside a documented five-minute function window. Neither source version nor workflow existence proves current public support. Render files are historical recovery material. |
| Shared skills library README (default `main`) | Supports copied project-local skills, with category-based organization; import procedure must resolve actual source paths and preserve customized files. No root license is documented there; capture per-skill provenance/license before redistributing. |

Evidence URLs use `https://github.com/SamuelAsherRivello/<repository>/blob/main/<path>`. Inspected blob SHAs: template AGENTS `7fcc98e1075f0997500583e3054f0e83dd07ceac`, checklist `03f41f14f077960e8b9ba55f5f3eefa726d7092c`, package `b03c24e5ff636ad03cb9db5aab953a30464f5036`, layout guide `fd85233bf285a0825352f15ee693cce2c486444a`; backend admission `df22c67acd7f5d340466a9dd412d78b2e4dff0be`, host room `0dce761b840c0a636479054235ee280d9dee4d97`, relay helper `c0c52f0d68d3e0d348cdc3fd52fee6a7d014fc20`, shared client `be2c72907f03aed89fe8a674343d0e207ed657a8`, Release workflow `ae98930b22c3475366ca5a60b2a5fe54215f9ec0`. These are file blob identities, not repository commits. GitHub connector reads succeeded after network-restricted shell reads failed. A template Pages workflow was not found at guessed `pages.yml` or `deploy.yml`; discover the actual workflow filename from its tree during bootstrap rather than asserting either exists.

## Goals / Non-Goals

**Goals:** Preserve next-step local sound without a network round trip; keep the host authoritative over accepted musical events; give every remote listener a fixed three-second event buffer; make eight-step identity and repeated cycles unambiguous; minimize changes to existing server consumers.

**Non-Goals:** Audio streaming, peer-to-peer networking, lockstep across every listener's final mix, persistent composition, eight musical bars, server-side simulation, or rewriting shared hosting as part of a small music feature. Hosting work needed for truthful delivery is a separate prerequisite, not an excuse to claim unsupported continuity.

## Decisions

### 1. Apply the user's specific timing clarification

Confirmed: sounds play once; eight circles advance every 500 ms; four sounds are identical for everyone; distinct pads deduplicate within a step; clock starts on room creation; relay server and host simulation. The final clarification says every origin hears itself next-step and all remote people hear that event three seconds later. This supersedes the earlier interpretation that the host hears *all* sounds first. The host is also a remote listener for guest-origin events.

The proposed implementation uses a host-defined monotonic epoch and a common live step grid. Define absolute step n with deadline T(n) = epoch + n * 500 ms; display index is `(n mod 8) + 1`. At the exact boundary a new tap belongs to the following step. An event is identified by room epoch, origin session, absolute step and sound. Its origin schedules at T(n); everyone else schedules at T(n) + 3,000 ms. Never add another three seconds at each relay hop or measure it from receipt time.

Example: a tap at 1.23 seconds targets absolute step 3 at 1.50 seconds (visible circle 4). Origin hears at 1.50; every remote listener hears at 4.50. The live clock at 4.50 shows circle 2, while the remote-playback marker identifies the original circle 4. Since three seconds is six steps, one cursor cannot truthfully indicate both live input and buffered remote playback. Keep one eight-circle timeline with a filled blue live marker and a smaller outlined remote marker six steps behind, plus labels. The user confirmed the shared live cursor and separate remote marker in the follow-up interview. The two-marker sketch and clarified brief are in prompt.md.

Rejected alternatives: delaying local sounds violates the final instruction; re-quantizing on packet arrival changes the selected step; treating cycle index alone as an ID replays or deduplicates the wrong cycle. Different listeners intentionally hear different mixes because each hears its own contribution early; do not promise globally identical simultaneous audio.

### 2. Host-owned event ledger with client prediction

Proposed game key `music-maker`; versioned protocol. Relay creates a private room, assigns four seats, names and colors, and identifies the creator as host. It validates message shape, session ownership, bounds, membership, rates and host-only publishing. It does not choose musical steps, generate metronome ticks, or resolve sound rules. Host owns the epoch, accepted-event ledger, step batching, and snapshots. Guests extrapolate presentation and predict their own audio from the synchronized clock; this is not independent authoritative simulation.

Client tap immediately adds a sound to the next-step set and sends intent; it need not wait until the step to transmit. Use pointer-down and keyboard 1–4 (ignore key repeat); a repeated pad within the step does nothing. Different players' same-instrument events remain distinct. A host's own tap follows the same ledger path locally without a network round trip. An echo never plays the origin's sound twice.

Proposed contract:

| Message | Direction | Bounded content |
| --- | --- | --- |
| musicClockRequest / musicClockReply | Guest through relay to host and back | Request ID, guest send time, host receive/send times, epoch, protocol version; server-stamped sender |
| musicIntent | Player to relay to host | Epoch, increasing sequence, absolute target step, one of four sound IDs; relay injects origin session |
| musicCommit | Host through relay to all | Epoch, host commit sequence, origin session/sequence, target step, sound, original deadline |
| musicSnapshot | Host through relay to newcomer | Epoch/time anchor, protocol version, host ID, last commit sequence, bounded events whose remote deadlines are still ahead |
| snapshot, presence, departed, notice | Existing lifecycle | Existing shapes retained; music gameState carries protocol-specific fields |

Cap ordinary per-client messages at 32/s and each encoded snapshot message at 14 KiB, leaving envelope headroom below the observed 16 KiB transport limit; no unrestricted arbitrary JSON relay. Use compact pending-event batches; if chunking is necessary, identify snapshot sequence/chunk count and install only a complete bounded snapshot. Host deduplicates per origin/step/sound, rejects invalid or unreasonably future steps, and accepts delayed requests only while their original remote deadline is at least 100 ms away. Do not shift an accepted event's source step. Rejected prediction is labeled unshared and is not replayed; a sound already heard locally cannot be undone. Keep an approximately 8-second rolling event ledger and dedupe horizon, prune regularly, and clear on epoch change/disconnect. Snapshots contain only still-pending remote events, not the entire ledger. Confirm limits in integration tests, not by copying the other game's 48 KiB snapshots.

### 3. Synchronize clocks and schedule audio separately from rendering

Host monotonic time is canonical; do not compare independent performance.now values directly or trust wall-clock equality. Sample host clock through ping/reply timing, retain low-RTT samples, estimate offset/uncertainty, refresh periodically, and slew small changes without moving already scheduled events. No frame-count/setInterval accumulation for musical time. Render derives the current step from elapsed canonical time.

Use Web Audio's AudioContext scheduling for four short original synthesized sounds and a quieter metronome beep. A short lookahead scheduler schedules known events; newly tapped local sounds are scheduled directly against the next boundary so lookahead cannot exclude them. Map monotonic canonical time to audio time. Target measured scheduling error <=25 ms for foreground WebGPU-capable browsers under the defined test profile; disclose physical audio-device latency as outside that software metric. Logical remote targets are exactly +3,000 ms. Validate audio graph event starts as well as timeline visuals.

Create/join is a user gesture that attempts audio activation. If suspended, show Enable Sound while the session clock continues. Muting changes local output only. Late-join/resume uses a fresh host clock snapshot; schedule only events not yet due for that listener, never replay elapsed history. Drop late remote events rather than playing immediately or rolling into another cycle, and expose a concise late-event status. Recovery beyond the buffer is explicitly lossy.

### 4. Small pixel-perfect interface in the existing shell

Proposed display name Music Maker Multiplayer, matching workspace purpose rather than the discarded Gungeon sample title. Landscape 16:9, fixed orthographic pixel stage, proposed 640x360 logical resolution, nearest sampling and integer scale when it fits; narrow devices use a compact landscape fit or rotate hint. Preserve the four corners: title top-left, links top-right, settings bottom-left, version bottom-right. Roster, pads, room code and all essential status stay inside the viewport, including fullscreen.

BabylonLiteAIEntry PixelPerfect2D renders the original pixel backdrop and eight pulse sprites. React supplies accessible roster, labeled pads and status overlays aligned with the scene. Animate discrete size frames centered on integer pixels, blue to bright blue; avoid fractional camera zoom, scrolling or a follow camera. Keep renderer state separate from musical time and audio scheduling. Do not pause the shared clock when a settings dialog opens; shell pause integration must affect only local interaction/presentation if needed. Backgrounding suspends local playback/inputs safely; on foreground resynchronize rather than emitting a catch-up burst. A backgrounded host must cease accepting new shared events until its clock/authority is healthy; host connection/liveness loss ends the session and cancels pending audio.

The template's discouragement of music and the create-game portrait default are overridden by the user's explicit music sandbox and horizontal layout. No win condition is invented. Provide keyboard, mouse, simultaneous touch pads, mute and documented silent-test URL option. No generated raster art is required for this abstract first version; procedural pixel elements and synthesized sounds are sufficient original assets.

### 5. Template bootstrap and delivery sequence

During apply, preserve this planning directory while generating the game through GitHub's template flow into the requested destination; never replace this workspace wholesale or push game-specific changes to the template. Verify new remote/default main, bootstrap history before adding project-specific files, and merge planning files without overwrites. Rename project-name to music-maker and update dependent paths. Import shared skills as real files per the explicitly invoked create-game workflow, retaining customizations and provenance; do not alter global skills.

Installed OpenSpec is 1.14.0; inspected template checklist pins generated skills to 1.13.1. Current planning uses the installed schema and no generated local skills. Before bootstrap, reconcile that tooling mismatch using the current shared-library workflow and record the compatible choice; do not downgrade global tooling or hand-edit generated skills silently.

Prepare/release/verify the additive backend contract before wiring the playable client to a pinned client tarball. Current source package 0.9.9 is not proof the new music API is published. Use actual Release workflow and existing-game regressions; do not invent a future version or asset filename. Client production goes to GitHub Pages and backend to an independently verified WSS endpoint. Discover credentials without printing secrets. Do not treat a generic function health check or four-minute relay as proof the indefinitely repeating room survives hosting renewal. Prefer verified existing infrastructure; if current hosting cannot meet continuity, track the hosting prerequisite and its permission/access needs explicitly.

## Risks / Trade-offs

- Three-second delay is noticeable and each origin hears itself early -> explain via live/remote markers and preserve the requested interaction rather than promising a synchronized final mix.
- Network messages can exceed the buffer -> drop stale events and report; verify no off-beat catch-up or cycle confusion.
- Browser sleep or audio suspension invalidates scheduling -> clear pending local playback and resynchronize; do not pause everyone through local settings.
- Host-only simulation can be dishonest -> suitable for a cooperative anonymous sandbox; relay still rejects guest host publications and spoofed identities.
- Existing helper auto-migrates hosts -> reuse validation/lifecycle patterns without that behavior because the user selected session termination.
- Vercel process-local rooms and duration limits conflict with unqualified forever-session claims -> the musical loop has no programmed end, but public continuity remains a separate release gate tested beyond ten minutes and a renewal boundary.
- Template generation could overwrite planning -> stage generation, compare overlapping paths, and preserve this change before importing.

## Migration Plan

No existing game data migration. Add isolated music room and optional shared-client events; run current consumer regressions and package checks. Stage backend release, verify two-client music exchange publicly, then pin its exact client release in the game and deploy Pages. On failure keep the client release unpublished or roll back endpoint/build to the prior verified backend/client pair using documented workflows; do not repeatedly mint versions to retry deployment. Preserve default main and task-only commits; no feature branch or PR is requested.

## Deferred Decisions and Apply Gates

The follow-up interview confirmed ending the session on host loss. The relay closes admission and notifies guests; clients cancel scheduled audio and show Host disconnected with create/join actions. No migration or host recovery grace. Guest rejoin uses fresh identity only while the original host remains active. The shared live cursor/remote marker and complete public delivery are confirmed.

The source inspection is sufficient for this proposal; implementation must pin current commits and check the shared server's active OpenSpec changes before editing it, especially its documented hosting-continuity change. No public endpoint, browser timing, package publication, or hosting capability was tested during planning. Display name, 640x360 resolution, and concrete software timing tolerances are proposed implementation choices for review. All schema artifacts can be complete while this plan remains gated on verified hosting/tooling prerequisites. Implementation and public release are explicitly authorized.


## Confirmed free-plan implementation constraint

The user requires Vercel Hobby only. The host browser retains musical authority while the relay transport is renewed at 240 seconds using a host-only snapshot signal. All clients retain the musical epoch and pending event deadlines; the old relay room is closed and the same private code is recreated before the 300-second invocation cap. This planned transport change is distinct from unexpected host loss, which still terminates the logical session immediately. No paid service or alternate provider is introduced. Actual public ten-minute continuity and renewal behavior must pass before the corresponding task is marked complete. Cross-instance durable storage is not introduced by this music feature; the known routing interruption risk is documented.
