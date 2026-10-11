---
name: docker-sandbox-codex
description: Set up and use Docker Sandboxes to run Codex in isolated microVMs, including installation, authentication, skills, workspaces, and lifecycle management.
---

# Docker Sandbox Codex

Use this skill when the user wants to install, configure, troubleshoot, or use
Docker Sandboxes (`sbx`) with Codex.

## Start with the right workspace

- For a mounted workspace, use the narrowest target folder and start `sbx` from
  that folder. Do not mount its parent or any unrelated folders. The sandbox
  can access host files only through explicit mounts.
- Use `--skills=off` by default to avoid mounting the shared host skill store.
  Enable shared skills only when the user asks for them.
- Use clone mode when the agent must work on an isolated copy rather than the
  host working tree. Explain which workspace mode is being used before launch.
- Start with Docker's deny-all network preset. Inspect effective network rules,
  including kit-provided rules, and allow only destinations the chosen model and
  harness need. Do not allow package registries by default. Deny rules take
  precedence over kit allows.
- Local `sbx policy` rules manage network access. Filesystem mount allowlists
  require Docker organization governance; when available, restrict read/write
  access to the intended target folder. Without organization governance, limit
  access by mounting only that folder.

## Installation and Codex subscription authentication

On Windows, check Windows 11, 64-bit Intel/AMD, and Windows Hypervisor Platform.
Install the current-user CLI with `winget install -h Docker.sbx`, or use the
official Docker release MSI when WinGet is unavailable. Then run `sbx login`.

Before creating or starting a Codex sandbox, check whether a global OpenAI
credential is already configured. Echo the exact command to the user before
running it, then execute:

```text
sbx secret ls --global --service openai --quiet
```

This lists only the credential name, not its value. If no `openai` entry is
listed, stop before running `sbx create` or `sbx run`. Tell the human that Codex
needs host-side OpenAI authentication and ask them to complete this command in
their own terminal:

```text
sbx secret set openai --oauth
```

Wait for the human to confirm the browser sign-in completed, then repeat the
metadata-only check. OAuth is stored globally on the host and can be reused
across sessions and sandboxes. The sandbox proxy authenticates model requests;
the raw OAuth credential stays out of the project and sandbox filesystem.

The listing confirms only that an OpenAI credential entry exists; it does not
show whether it is OAuth or an API key. If the user specifically wants their
Codex subscription, ask them to confirm the entry is the OpenAI account OAuth
credential before proceeding. Never request, print, copy, or inspect credential
values. Do not use host `~/.codex` files as a substitute for Docker's secret
store.

## Visible command execution

For every shell command used to set up, inspect, start, or manage a sandbox,
print the exact command to the user immediately before executing it. Print
multiline commands line by line in their executed order. Do not hide commands in
scripts, aliases, or compound invocations. Include read-only checks such as
`sbx secret ls`, `sbx policy ls`, and `sbx ls`. Never echo secret values or
commands containing credentials.

Before running `sbx run` or `sbx create`, summarize the workspace path, skills
mount setting, network policy, and OpenAI credential check result. If
authentication is missing or subscription OAuth is unconfirmed, do not start
the sandbox; ask the human to complete or confirm authentication first.

## Locked-down launch procedure

For a project workspace, install required npm dependencies in the target folder
on the host before launch. Do not give the sandbox npm registry access to install
packages. Echo and run the following host-side checks in order:

```text
sbx policy init deny-all
sbx policy ls --type network --wide
```

Tell the human that `sbx policy init deny-all` changes the default network
preset for all local sandboxes on this host. Review the listed rules and remove
stale broad allows that the selected Codex model and harness do not require.
Organization policy may further restrict access. Check the sandbox's effective
kit rules after it starts; add explicit per-sandbox denies for any unnecessary
destination, since deny rules override kit allows.

For a Windows PowerShell project at `D:\path\to\project`, a typical launch is:

```powershell
Set-Location -LiteralPath 'D:\path\to\project'
sbx run --name my-locked-project --skills=off codex .
```

Echo each line before executing it. Use the actual target path and a sandbox
name that is not already in use. This mounts only the target folder and turns
off the shared skills mount. The deny-all policy, audited global rules, and
reviewed kit rules define network access; do not add npm registries to the
allowlist. Keep the sandbox stopped until the OpenAI subscription OAuth check
above is complete.

## Shared skills

Inspect and manage the persistent shared skill store with:

```text
sbx skills import
sbx skills ls
sbx skills add <owner>/<repository> [--skill <name>]
sbx skills update
```

Codex reads shared skills from `/home/agent/.agents/skills`. New sandboxes use
the shared store read-only by default. Use `--skills=readwrite` only when the
user explicitly needs the sandbox to update shared skills; use
`--skills=off` to keep a sandbox outside that shared boundary. Keep
project-specific skills in the mounted project's `.agents/skills` directory.

## Lifecycle and verification

Use `sbx ls` to verify the daemon and sandbox state, `sbx stop <name>` to pause
a sandbox, and `sbx exec -it <name> bash` to inspect its environment. Explain
that `sbx rm <name>` permanently removes the sandbox's internal files and
requires confirmation; do not run it without explicit authorization.

When diagnosing failures, check `sbx diagnose`, the sandbox name, workspace
mode, authentication, network policy, and whether the sandbox was created
before a changed skills setting. Existing sandboxes retain their original
skills mount mode and may need recreation to change it.

Prefer current Docker documentation for version-sensitive syntax:
https://docs.docker.com/ai/sandboxes/agents/codex/
https://docs.docker.com/ai/sandboxes/workflows/agent-skills/
https://docs.docker.com/ai/sandboxes/configuration/credentials/
https://docs.docker.com/ai/sandboxes/security/policy/
https://docs.docker.com/reference/cli/sbx/secret/ls/
