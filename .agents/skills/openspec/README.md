# OpenSpec

Use these workflows to shape, implement, and close a focused repository
change. The sequence below is a common path, not a required gate.

## Suggested Flow

```text
Optional discovery: dashboard | explore | grill-me
Plan:               propose <-> update-change
Build:              apply-change
Close:              sync-specs -> archive-change -> commit-inclusive
Shortcut:           macro-finalize-sync-archive-commit-push
Release:            ai-skills-release-version after a remote commit exists
```

`openspec-dashboard` can be used at any stage. `openspec-commit-inclusive`
performs and verifies its normal push, so the close flow does not require a
second push. Version release is intentionally separate from OpenSpec; use
[`ai-skills-release-version`](../ai-skills-create/ai-skills-release-version/SKILL.md)
only after a releasable remote commit exists.

## User Workflows

- [openspec-explore](./openspec-explore/SKILL.md): Investigate a change before
  committing to implementation.
- [openspec-grill-me](./openspec-grill-me/SKILL.md): Interview the user to
  settle planning decisions.
- [openspec-propose](./openspec-propose/SKILL.md): Create a complete change
  proposal and planning artifacts.
- [openspec-update-change](./openspec-update-change/SKILL.md): Revise an
  existing change's planning artifacts.
- [openspec-apply-change](./openspec-apply-change/SKILL.md): Implement a
  planned change task by task.
- [openspec-sync-specs](./openspec-sync-specs/SKILL.md): Sync accepted delta
  specifications into the main specifications.
- [openspec-archive-change](./openspec-archive-change/SKILL.md): Archive a
  completed OpenSpec change.
- [openspec-commit-inclusive](./openspec-commit-inclusive/SKILL.md): Commit
  and push all files attributable to one archived change.
- [openspec-macro-finalize-sync-archive-commit-push](./openspec-macro-finalize-sync-archive-commit-push/SKILL.md):
  Run the close sequence for one completed change.
- [openspec-dashboard](./openspec-dashboard/SKILL.md): Open or inspect the
  local OpenSpec dashboard.
