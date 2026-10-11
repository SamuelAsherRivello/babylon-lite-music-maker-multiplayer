---
name: ai-skills-release-version
description: Release a template-compatible repository through its checked-in GitHub Actions workflow and version.txt source. Use when publishing a versioned release.
---

# AI Skills Release Version

Use this skill when the user explicitly asks to bump a repository version and
publish a GitHub release. It requires a checked-in GitHub Actions release
workflow and a `version.txt` source, but does not require any planning system
or change artifact.

## Setup Gate

Before changing `version.txt` or dispatching a workflow, verify all of the
following in the target repository:

- A configured GitHub remote and a releasable remote branch.
- A checked-in GitHub Actions workflow that creates a versioned release.
- A `version.txt` file used by that workflow or clearly documented as its
  version source.
- A documented or workflow-defined rule for deriving the next version.

The shared repository template is a compatible pattern. A different repository
is acceptable only when its checked-in workflow provides equivalent evidence.
If a prerequisite is missing or ambiguous, stop and report it. Do not create
workflows, tags, releases, version files, or repository settings.

## Workflow

1. Confirm the repository root, remote, branch, dirty state, current
   `version.txt`, tags, and releases. Fetch the authoritative remote branch
   before choosing a release version. Preserve unrelated user changes.
2. Inspect `.github/workflows`, release documentation, and `version.txt` to
   identify the authoritative release workflow and its next-version rule. Do
   not assume a patch bump when the checked-in workflow says otherwise.
3. Verify that the intended release commit is present on the workflow's remote
   branch. Do not release a local-only, divergent, or stale commit.
4. Derive the next version from the repository's established rule, update
   `version.txt`, and validate the documented build or test checks when
   practical. Commit and push that version-source update only through the
   repository's normal safe workflow.
5. Check that the target version does not already have a tag or release, then
   dispatch the existing release workflow using its documented mechanism.
6. Monitor the run to completion and verify the remote tag, release, target
   commit, and version source. Report their exact URLs or identifiers.

## Safety

- A workflow dispatch, local commit, and remote release are different states;
  verify each before reporting success.
- Never force-push, rewrite history, create missing release infrastructure, or
  release from an unverified remote branch.
- Never overwrite unrelated user changes or create a duplicate release.
- If validation, remote state, or workflow behavior is ambiguous, stop and
  report the smallest concrete blocker.
