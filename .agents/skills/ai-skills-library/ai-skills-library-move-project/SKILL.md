---
name: ai-skills-library-move-project
description: Move named or all valid global Codex skills into the current project. Use when localizing globally installed skills for a project.
---

# AI Skills Library Move Local

Move one named global skill, or use `all` to move every valid skill from `$HOME/.agents/skills` into the current project's `.agents/skills` directory.

1. Accept exactly one skill folder name or the literal `all`; reject paths and names containing path separators.
2. Resolve and show the global source and project destination paths. Validate every selected source as a physical skill directory containing `SKILL.md`, with no symbolic links or junctions inside it.
3. Use `scripts/skill-copy-lifecycle.ps1` with `-Action move-local -Skill <name|all> -ProjectDirectory <project-root>` when the library checkout is available. Preflight the full selection before changing files. Differing destination contents require explicit replacement authorization; identical destinations are verified before source removal.
4. Outside the `ai-skills-library` checkout, move means copy and verify the complete skill at the project destination, then remove its global source. If copying, verification, or preflight fails, preserve the source.
5. When running inside the `ai-skills-library` checkout, copy into the categorized catalog and keep the global source. Explain that the repository retains its canonical catalog copy. For `all`, use the categories supported by the library helper.
6. Report changed, skipped, and failed names separately. Do not publish or perform Git operations.
