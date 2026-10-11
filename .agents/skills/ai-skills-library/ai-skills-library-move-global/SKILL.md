---
name: ai-skills-library-move-global
description: Move named or all valid project-local skills into global Codex skills. Use when promoting a project's skills to global discovery.
---

# AI Skills Library Move Global

Move one named project skill, or use `all` to move every valid skill from the current project's `.agents/skills` directory into `$HOME/.agents/skills`.

1. Accept exactly one skill folder name or the literal `all`; reject paths and names containing path separators.
2. Resolve and show the project source and global destination paths. Validate every selected source as a physical skill directory containing `SKILL.md`, with no symbolic links or junctions inside it.
3. Use `scripts/skill-copy-lifecycle.ps1` with `-Action move-global -Skill <name|all> -ProjectDirectory <project-root>` when the library checkout is available. Preflight the full selection before changing files. Differing destination contents require explicit replacement authorization; identical destinations are verified before source removal.
4. Outside the `ai-skills-library` checkout, move means copy and verify the complete skill at the global destination, then remove its local source. If copying, verification, or preflight fails, preserve the source.
5. When running inside the `ai-skills-library` checkout, copy to global and keep the catalog source. Explain that the repository retains its canonical copy. For `all`, use the categorized catalog selection.
6. Report changed, skipped, and failed names separately. Do not publish or perform Git operations.
