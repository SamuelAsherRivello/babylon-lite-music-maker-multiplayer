# Music Maker Multiplayer

Work on the default `main` branch unless the user requests an isolated Git workflow. Preserve unrelated edits and never publish another project's work.

The repository root is the npm root. `music-maker/` is the Vite application root; documentation and canonical screenshots belong in `docs/`. Run `npm ci`, `npm test`, `npm run build` from the repository root. The application is a landscape 16:9 cooperative music sandbox for one to four people. No orientation toggle, combat, score or progression.

Use Babylon Lite with WebGPU only. Show unsupported-device errors; do not substitute a fallback renderer. Explicitly configure BabylonLiteAIEntry PixelPerfect2D and use its addSprite, move, update, updateView and centerView methods. Keep fractional simulation state separate from integer render positions. The 640×360 OffscreenCanvas backing raster stays fixed; browser CSS scaling fits the viewport. Fractional display scales may produce uneven physical pixel widths.

Keep React controls inside BrowserSurface's viewport, including fullscreen. Preserve the four corner roles: title upper left, repository links upper right, settings lower left, version lower right. Use checkboxes for boolean settings and remove dead source/styles. Keyboard 1–4 and pointer/touch pads trigger one-shot sounds. `?mute=true` must silence all audio.

The host browser owns musical time and accepted events. The Colyseus server only admits players and relays bounded messages. Local sounds play at the next 500 ms step without an acknowledgement; remote listeners use source deadline +3000 ms. Never quantize by receipt time. Unexpected host loss ends the session. Planned transport renewals retain host authority and original deadlines.

Use only Vercel's free plan for the multiplayer backend. Do not enable paid features or suggest other providers. Adapt to the 300-second connection limit with planned relay renewals and test actual public behavior. Keep credentials out of browser code and documentation.

The active OpenSpec change is `add-multiplayer-pixel-music-sandbox`. Mark only verified tasks complete. Generated OpenSpec skills use the template-pinned CLI 1.13.1; do not hand-edit them. Imported library skill provenance is recorded in docs/music-implementation.md. Skills outside the project remain untouched.

Release using the checked-in release.yml and deploy-pages.yml workflows. `version.txt` is the release version source. Verify WebGPU gameplay with two independent browser contexts, real relay messages, latency/jitter, capacity, guest recovery, host loss and planned renewals. Document software scheduling separately from physical audio latency and emulated touch separately from hardware tests. Preserve the original request and labeled follow-ups in the README. Its conversation URL is unverified; do not invent one.
