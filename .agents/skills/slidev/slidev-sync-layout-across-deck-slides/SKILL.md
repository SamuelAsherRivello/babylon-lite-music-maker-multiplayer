---
name: slidev-sync-layout-across-deck-slides
description: Synchronize specified Slidev slides so their image scale, crop, and embedded-image text positions match, with Playwright visual QA.
---

# Slidev Layout Across Deck Slides

Use this skill when the user identifies two or more Slidev slides and asks to make their image layout match, for example: “sync-image-layout across slides 10, 11, and 12; keep image text position and scale matching.”

Apply changes only to the requested slides and the shared layout code or metadata strictly needed to support them. Preserve each slide’s distinct content and artwork unless the user specifically asks to replace it.

## Workflow

1. Read the deck source, shared layout component, and any relevant source manifest or layout checks. Identify the image scale, position, pane geometry, and overlay treatment of every requested slide.
2. Treat the user-named reference slide as the alignment target. If none is named, use the first listed slide and state that choice.
3. Make the smallest source change that aligns the requested properties. Keep one common scale. For artwork with different internal spacing, adjust only the affected slide’s image position by the measured offset.
4. Build the deck, then run Playwright against a local Slidev server. Capture each requested slide under the repository-root `output/screenshots/<task>/` directory.
5. Compare the rendered screenshots, including embedded raster text such as labels. Do not declare the work complete until the requested positions and scale visibly match. Iterate when they do not.

## Playwright QA

- Render at the deck’s standard 1280×720 viewport unless the deck declares another canvas size.
- For text embedded in raster artwork, use screenshots to measure and visually compare the target labels. DOM geometry alone cannot verify those positions.
- Keep QA artifacts under `output/`; do not change unrelated slides to make a broad deck-level check pass.
