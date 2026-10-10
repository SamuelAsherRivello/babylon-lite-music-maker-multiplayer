# Tasks

## 1. Update authoritative game guidance

- [x] 1.1 Update `AGENTS.md` and `AGENTS_TEMPLATE_USAGE_CHECKLIST.md` with the confirmed app/game orientation and game decisions; verify every agreed choice appears once without conflicting wording.
- [x] 1.2 Update the game integration guide to explain orientation, demo removal, WebGPU-only behavior, rendering freedoms, viewport/gutter roles, scrolling, and sound; verify the guide has no contradictory game instructions.

## 2. Reconcile specifications

- [x] 2.1 Update the main `game-integration-guidance` and `template-ai-guidance` specs from the deltas; verify each new requirement has a scenario and existing general square viewport support remains valid for apps.
- [x] 2.2 Run `openspec validate update-info` and `git diff --check`; resolve reported issues and inspect the final diff for agreement across guidance and specs.
