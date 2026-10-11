---
name: ai-skills-project-run-status
description: Report whether the current project has a running Vite server, including its process, port, health, and browser routes.
---

# Project Run Status

Use this skill when the user asks whether the current project is running or
what Vite server it is using.

## Current project

1. Read `AGENTS.md` and resolve the exact project root.
2. If `BIS/scripts/project-run-config.mjs` exists, read its declared
   `serverMode` and routes. A shared configuration means one Vite process can
   serve many package routes; a single configuration means one entry point.
3. Inspect Windows process command lines, parent/child relationships, and
   listening ports. Match ownership by project root/command context, not by
   port number alone.
4. Report either `none running` or each matching server's PID, process tree,
   port, command, start time when available, and whether the process is the
   project's single allowed server.
5. For each matching server, verify the listener and HTTP health for every
   declared route. If healthy,
   open its routes in the in-app browser and report `<browser tab name> — URL`.
   If the browser cannot attach, report that limitation instead of inventing
   tab names.

## Optional all-projects view

If the user asks for all Vite servers, enumerate listening Vite/npm/node
processes across projects and group them by normalized working directory. Show
project root, PID, port, command, health, and duplicate count. Clearly separate
the current project from other projects. Do not stop or modify anything.

Status is read-only: never start, stop, kill, install, or reconfigure a
server.
