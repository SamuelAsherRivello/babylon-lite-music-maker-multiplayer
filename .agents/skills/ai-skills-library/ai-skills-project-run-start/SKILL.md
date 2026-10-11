---
name: ai-skills-project-run-start
description: Restart exactly one Vite development server for the current project, verify it without opening browser windows, and report application-named links.
---

# Project Run Start

Use this skill when the user asks to run, start, host, or preview the current
local web project.

## Invariant

There must be exactly zero or one development Vite server for the project
directory. A start request means restart: identify every Vite/npm/node process
owned by this project, stop those project-owned process trees, verify they are
gone, and then launch exactly one fresh server. Never stop another project's
server and never run a second Vite for the same project.

## Start

For the fast path, after reading the repository config, invoke the sibling
`run-project.ps1` helper once with `-ProjectRoot`, `-Port`, and the routes JSON.
It performs scoped process cleanup, launches the exact `npm run dev -- --port`
command, waits with 50 ms polling, and verifies every route in one host-level
operation. It targets a three-second warm local start and returns compact JSON
for the final links. If the helper fails, stop and report its precise failure;
do not launch a second server manually.

1. Read the repository `AGENTS.md`, confirm the package manager and `dev`
   script, and determine the routes the launcher exposes. If
   `BIS/scripts/project-run-config.mjs` exists, read and validate its
   `serverMode`, `preferredPort`, and `routes`; otherwise infer the single
   entry point or routes from the current launcher output and HTTP responses.
   A customized project script/config is valid and authoritative for that
   project.
2. Inspect process command lines, parent/child relationships, working
   directories, and listeners to find all existing Vite servers owned by this
   project. Ownership must be established from the project root or command
   context, never from a port number alone.
3. If any owned server exists, stop only those exact process trees. On Windows,
   use scoped process control such as `taskkill /PID <PID> /T /F` only after
   confirming each PID belongs to this project. Wait and re-scan until no
   project-owned Vite process or listener remains. If a process cannot be
   stopped, do not launch a replacement; report the blocker.
4. Choose the project's declared/preferred port and probe it plus subsequent
   dedicated local ports. A listening port owned by another project is
   unavailable; do not take it over.
5. Immediately before launch, re-scan the project one final time. If another
   invocation has started a project-owned Vite server, stop/reconcile it first
   rather than launching another.
6. Execute the real command from the project root in a live Windows PTY:
   `cmd.exe /d /c "npm run dev -- --port <PORT>"`. Keep its returned session or
   process identity. The command must be executed before opening a terminal
   panel; `open_in_codex` only displays a session and does not type commands.
7. Enforce one server after launch: confirm the new process tree is the only
   Vite process associated with this project. If duplicates appear, stop the
   extra project-owned trees before continuing.
8. Verify the listener and HTTP response for every exposed route declared by
   the current run configuration or launcher. In `shared` mode this is one
   Vite server serving multiple package routes; in `single` mode verify the one
   entry point. Never start one Vite per package unless the project explicitly
   declares that topology.
9. Verify the
   expected application identity, not only Vite's startup banner. Use the
   host-level/local runtime when sandbox loopback access prevents verification.
10. Do not open browser windows or tabs as part of verification. Report each
    verified route using its application identity/title from the HTTP response:
    `<application name> — <verified URL>`.
    For this project, use `BIS - Prototype Faucet` for `/prototype-faucet/`
    and `BIS - Prototype Onboarding` for `/onboarding/`, even if the HTML
    title or launcher label differs.
11. Keep the one server running. If the terminal panel cannot attach, report that
   limitation honestly while retaining the live process and its identity.

Never claim a URL is working without listener and HTTP verification. Do not
install dependencies or change project configuration as part of start. All
commands in this workflow must preserve the one-Vite-per-project invariant;
never batch-launch multiple Vite servers for the same project or reuse a
project-owned process after a restart request.
