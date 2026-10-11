---
name: slidev-resync-templates-decks
description: Diagnose and safely resynchronize declared Slidev template-to-deck layout mappings. Use for a stale deck after template changes, mapping drift, or a request to compare a Slidev catalog with its content decks; not for ordinary slide-content editing.
---

# Slidev Resync Templates Decks

Treat a template timestamp as a reason to inspect, not proof that a deck is stale. In a shared-theme Slidev system, template copy and example changes do not automatically change deck content. Theme layout changes affect every deck that selects the layout; catalog page reordering affects generated mapping metadata.

## Inspect before changing anything

1. Start at the Slidev workspace `package.json`. Identify package-declared `dev:*` and `build:*` commands that use the project’s shared theme.
2. Resolve the catalog entry through its Slidev `src` chain. Do not assume an entry-point wrapper is the canonical Markdown catalog.
3. Treat all other package-declared shared-theme entries as the resync inventory. Exclude build output, `node_modules`, legacy/template-comparison decks, and arbitrary Markdown that is not a declared shared-theme deck.
4. Record the most recently modified canonical template/catalog source, then the most recently modified declared deck. If any declared deck is older than that canonical source, audit its mappings; do not resync merely because of the timestamp.
5. Inspect the meaningful diff and current mappings. Classify the finding:
   - **Catalog-only**: copy, guidance, or example-content changes; no deck mapping update is implied.
   - **Theme change**: shared layout code or styles changed; inspect rendering and verify, but do not copy catalog content into decks.
   - **Mapping drift**: a deck’s rendered `layout`, generated `templateLayout`, or `catalogSlide` no longer agrees with the catalog.
   - **Deck-content change**: authored deck material changed; preserve it unless the user asks to edit content.
6. Run the workspace’s static layout-contract check before proposing a repair. Report the declared inventory, the observed mismatch, and whether a resync is actually needed.

## Fallback resync

Never silently modify decks. An audit, timestamp comparison, or request to explain drift is not authorization to repair it.

After the user explicitly approves a repair, run the project’s documented fallback command (normally `npm run sync:layout-mappings`) from the Slidev workspace. It must preflight the complete declared inventory, update generated mapping metadata only after every layout and catalog example resolves, and rerun the contract verifier.

Treat a successful fallback as complete only for the package-declared inventory it reports. If a deck is absent from that inventory, explain that it needs an official shared-theme entry before it can receive the same guarantee. If preflight or verification fails, stop: do not manually patch a subset of deck mappings to make the check pass.

After a successful resync, inspect the diff. Expected changes are limited to the layout catalog and generated `templateLayout` / `catalogSlide` fields. Escalate unexpected authored-content, image, or theme changes to the user rather than treating them as generated output.

## Normal workflow guidance

Prefer supported package preview and build commands over direct `slidev` CLI invocations, because the project may attach lifecycle synchronization to those commands. Explain that this improves the chance of current mappings but does not replace the fallback’s preflight-and-verify guarantee.
