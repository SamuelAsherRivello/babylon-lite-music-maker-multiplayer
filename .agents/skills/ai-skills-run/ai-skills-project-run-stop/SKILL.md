---
name: ai-skills-project-run-stop
description: Stop the one Vite development server belonging to the current project, or report that none is running.
---

# Project Run Stop

Use this skill when the user asks to stop, shut down, or kill the current
project's Vite development server.

## Workflow

1. Read `AGENTS.md` and resolve the exact project root.
2. If `BIS/scripts/project-run-config.mjs` exists, read it for the project's
   declared server topology, but do not assume that every package is a server.
3. Identify processes and listening ports whose command line, working
   directory, or child process tree belongs to that project. Inspect first;
   never infer ownership from a port alone and never target another project.
4. If no matching Vite/npm/node server is running, report exactly that and do
   not run a stop command.
5. If matching server process trees are running, report their PIDs/ports, then stop only those
   process tree using the platform's normal process-control facility. On
   Windows, prefer a scoped `taskkill /PID <PID> /T /F` after confirming the PID
   and command line.
6. Verify the owned listener and process are gone. If they remain, report the
   remaining identity and the reason stopping was incomplete.

The project invariant is one server maximum, but stopping must still be
ownership-scoped. Never kill all `node`, `npm`, or Vite processes globally.
