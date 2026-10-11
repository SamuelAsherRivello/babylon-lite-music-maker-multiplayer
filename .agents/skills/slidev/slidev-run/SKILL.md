---
name: slidev-run
description: Start and verify the Blockchain Integration Service Slidev documentation landing page and its proxied decks.
---

# Slidev Run

Use this skill when the user asks to run, host, or open the Slidev documentation landing page in this repository. It is not for building or exporting Slidev artifacts.

The Slidev workspace is `BIS/documentation/slidev`. Its local landing page is `http://localhost:3032/`; it proxies these independently served decks:

- Modrian Template: port 3049 at `/slidev/modrian-template/`
- Blockchain For Gaming: port 3051 at `/slidev/blockchain-for-game/`
- Outro: port 3052 at `/slidev/outro/`

Start each declared `dev:*` script sequentially, then start `npm run dev` for the launcher. Reuse a process only after verifying that its expected route returns the Slidev document. Keep the processes running in the background and place launcher logs under repository-root `output/logs/slidev-landing/`.

Verify the landing page and the first slide of every deck through port 3032 before reporting success:

- `/`
- `/slidev/modrian-template/1`
- `/slidev/blockchain-for-game/1`
- `/slidev/outro/1`

Test a real browser load as well as HTTP status when a route has failed before. Check console errors; an HTTP 200 alone does not establish that a Slidev deck rendered. If concurrent deck servers produce Vite optimizer-cache conflicts, use distinct cache directories per server in the repository's Vite configuration, then restart only the affected preview processes. Do not bypass the declared `dev:*` lifecycle, because it synchronizes and validates the local Mondrian layout mappings.

Return the landing link first, then only the deck link the user requested. Mention a non-default local port only when the documented port is unavailable.
