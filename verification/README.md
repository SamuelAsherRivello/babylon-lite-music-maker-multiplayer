# Browser acceptance probes

These are Playwright CLI `run-code` callbacks, run from the repository root against a single local Vite server and the public Vercel backend. They return assertions and instrumentation, rather than claiming physical speaker measurements. Start with an Edge/Chromium WebGPU session named `music` at the local URL printed by Vite.

```powershell
playwright-cli -s=music run-code --filename=verification/layout.js
playwright-cli -s=music run-code --filename=verification/audio.js
playwright-cli -s=music run-code --filename=verification/timing.js
playwright-cli -s=music run-code --filename=verification/renewal.js
playwright-cli -s=music run-code --filename=verification/duration-start.js
# Keep both contexts open for more than ten minutes.
playwright-cli -s=music run-code --filename=verification/duration-result.js
playwright-cli -s=music run-code --filename=verification/room-flows.js
```

Set the local base URL in timing.js if Vite uses a port other than 5410. Timing creates two independent browser contexts and proxies WebSocket messages with ordered delay/jitter in both directions. Duration retains those contexts and their injected network conditions. Room flows end the host session, so run them last. Layout and audio probes reload the initial page, so run them before creating the timing sessions.

Results, browser versions, release references and limitations belong in `docs/music-implementation.md`. Only passing recorded runs establish acceptance. Touch input here is emulated; software scheduling does not measure device output latency.

The timing harness rejects Colyseus's Node-style object subprotocol probe synchronously before Playwright interception, matching native browser WebSocket behavior. It enters the guest through the room-code control; room-flows separately verifies automatic invite-link entry. The duration collector excludes earlier traces and requires two additional ordinary renewals during its measurement window.

The parallel-room wrapper is `verification/run-parallel-rooms.ps1`. It creates an independent four-player room, runs room-flows there and verifies that an existing host/guest duration pair has no foreign notes or roster changes. Preload the late joiner's application before generating its buffered test event, so module/shader startup is not mistaken for network-buffer delay.