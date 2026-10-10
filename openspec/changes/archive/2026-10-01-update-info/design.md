# Design

## Context

See proposal.md for motivation. The repository contains a reusable browser layout, an orientation-switching demo UI, a Babylon Lite 2D showcase, and game-integration documentation. The requested change is to the consuming-agent guidance and its specifications; the demo runtime itself remains unchanged.

## Goals / Non-Goals

**Goals:**
- Put the agreed game-specific decisions in the primary agent instructions, checklist, integration guide, and OpenSpec requirements.
- Clearly distinguish starter demonstrations from required game behavior.

**Non-Goals:**
- Change the template's own orientation toggle or showcase implementation.
- Add game features, audio assets, renderers, dependencies, or app behavior.

## Decisions

- Use `AGENTS.md` for concise rules and the checklist for project-creation gates; make the integration guide the detail source for game behavior.
- Keep the browser layout validator's existing square-ratio capability intact, while directing every new app or game concept to choose portrait or landscape.
- Explain that a project removes the orientation toggle while preserving the selected template viewport display.
- Treat Pixel Perfect as the required policy for all 2D games, independently from each game's chosen logical resolution and render scale.
- Describe WebGPU failure as an unsupported state with a clear message and no fallback renderer.
- Put audio requirements in game guidance: optional audio, no recommended music, 4–10 recommended event sounds, UI mute, and documented URL mute argument.
- Update documentation and specs only; do not edit runtime code.

## Risks / Trade-offs

- The template demo continues to expose an orientation toggle, so wording must explicitly say the game adaptation removes it and must not preserve it as a game feature.
- Pixel Perfect does not promise universal physical-pixel alignment; retain the guide's existing qualification.
