# Proposal

## Why

Game AIs can mistake template demonstrations and generic layout choices for requirements of the resulting game. The repository guidance also does not yet capture the agreed rules for orientation, renderer availability, resolution, gutters, scrolling, or optional sound.

## What Changes

- Clarify that every new app or game chooses portrait or landscape, uses the matching template viewport display, and removes the orientation toggle and its shortcut/persisted override.
- Clarify that the Babylon showcase is only a renderer example; Babylon Lite is WebGPU-only with no fallback, and the game AI implements the requested scene, including for 3D.
- Require Pixel Perfect for 2D games while leaving each game free to choose logical resolution and render scale.
- Clarify viewport priority, optional secondary gutter content, free choice of scrolling behavior, and sound/music/mute expectations.
- Update the game integration guide, AI guidance, template usage checklist, and matching OpenSpec requirements to remove contradictions.

## Capabilities

### New Capabilities

### Modified Capabilities
- `game-integration-guidance`: Define game-specific orientation, renderer, resolution, gutter, scrolling, and audio decisions.
- `template-ai-guidance`: Require the game project choices and checks in the consuming-agent workflow.

## Impact

Documentation and OpenSpec specifications only: `AGENTS.md`, `AGENTS_TEMPLATE_USAGE_CHECKLIST.md`, `project-name/documentation/layout-and-game-integration.md`, and OpenSpec delta/main specs. No runtime code, dependencies, or template demo behavior changes in this change.
