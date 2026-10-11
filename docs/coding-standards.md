# Lightweight coding standards

Keep the music runtime easy to extend. Paths below are relative to `music-maker/`:

- Put reusable React components, layout logic, and styles in `src/ui/`.
- Put renderer integration in `src/content/` and musical rules/audio/transport in `src/music/`.
- Use one component per file, name React components in PascalCase, and name helpers by the behavior they provide.
- Keep imports within a layer when possible; UI may receive content through props, while content should not own the UI shell.
- Keep renderer implementation and lifecycle within `src/content/`. This game requires Babylon Lite with WebGPU and PixelPerfect2D; show an unsupported-device state when initialization is unavailable.
- Prefer small focused changes and update the focused tests when a source boundary or layout contract changes.
