---
name: ai-skills-create-app
description: Create a non-game React application from the shared repository template. Use when starting an application rather than a game.
---

# AI Skills Create App

Create a new repository and React application from the shared repository template.
This is an application workflow: do not add game engines, Babylon-specific
packages, gameplay loops, or game rendering unless the user explicitly changes
the requested scope.

## Inputs

Accept natural language or these prompt fields:

| Input | Required | Default |
| --- | --- | --- |
| `app` | Yes | The application's users, purpose, and essential features. |
| `name` | Yes | Repository name unless a separate slug is supplied. |
| `folder` | No | A local folder derived from `name`. |
| `project` | No | Display name derived from `name`. |
| `visibility` | No | `public`. |
| `owner` | No | The authenticated GitHub account. |
| `requirements` | No | Explicit features, exclusions, visual direction, and delivery scope. |

Use `https://github.com/SamuelAsherRivello/github-repository-template` unless
the user explicitly supplies another template.

## Boundary

- If the request is for a game, game mechanic, game engine, or Babylon-based
  renderer, stop and direct the user to `$ai-skills-create-game`.
- Create a React application only; preserve the template's existing project
  conventions unless the user requests a compatible change.
- Do not publish, deploy, or release unless the user explicitly includes that
  delivery scope.

## Workflow

1. Derive any omitted repository identity fields and confirm only information
   that cannot be safely inferred, including an unavailable owner or a
   conflicting existing repository.
2. Verify GitHub authentication and template-generation permissions. Create
   the repository through GitHub's template flow; never overwrite or reuse an
   existing repository or local folder without an explicit request.
3. Clone the generated repository, verify its remote and default branch, and
   read its `AGENTS.md` and template usage checklist before changing code.
4. Inspect the generated React/Vite structure, then implement the requested
   application as a non-game browser experience. Keep the result responsive,
   accessible, and proportionate to the requested scope.
5. Run the repository's documented checks. Report the repository URL, local
   checkout, validation result, and any requested delivery outcome.

6. Run the creation triage quality gate before reporting completion:
   - Run `$ai-skills-triage-analyze` against the generated repository and create its
     required packet.
   - Check that the repository has canonical agent instructions, discoverable
     build/test/lint/type-check commands, a project/module map, a definition
     of done, maintenance relationships, and safety boundaries.
   - Apply only bounded, behavior-preserving conformity gaps through
     `$ai-skills-triage-standardize`, then verify those changes and run Analyze again.
   - Treat module ownership, public contracts, dependency direction, state
     ownership, and inter-module communication findings as deferred candidates
     for `$ai-skills-triage-rearchitect`; do not refactor them automatically.
   - Keep application behavior independently testable from React presentation
     and external adapters where the feature has meaningful domain or
     application logic. Preserve valid template conventions rather than
     forcing a generic source tree.
   - Report the final triage packet, Standardization score, Architecture score,
     verification evidence, and any deferred architecture candidates.

## Safety

Never expose credentials, force-push, delete repositories, overwrite a local
folder, or include unrelated working-tree changes. If authentication,
permissions, or an existing destination blocks creation, report the precise
blocker and stop.
