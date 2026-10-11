---
name: slidev-slides-to-content
description: Inspect Slidev templates and presentation decks in the active project, then produce a slide-by-slide content inventory.
---

# Slidev Slides To Content

Create an accurate, concise inventory of every Slidev template and deck in the active project. This is a reporting task: do not edit presentation sources unless the user also asks for changes.

## Discover the inventory

- Start at the active project root. Find Slidev workspaces through `package.json` scripts, Slidev configuration, and Markdown files with Slidev-style frontmatter.
- Use workspace documentation and script names to distinguish templates (catalogs, starter decks, or explicitly named template sources) from presentation decks. Treat a Markdown file imported by another entrypoint as part of that entrypoint, not a separate deck.
- Do not mistake a theme package, component, image asset, or output directory for a template or deck.
- Read every discovered entrypoint and its imported Markdown sources. Preserve the authored visual order of its slides.

## Describe slides

- Include every rendered slide, including section dividers, repeated titles, diagrams, and image-only slides.
- Use the slide's visible title where one exists. For an untitled visual slide, create a short factual label from its image, layout, and neighboring content.
- Give each slide a one-sentence plain-language summary of what it communicates. For progressive or repeated slides, explain what that particular version adds or highlights.
- Do not invent claims that are absent from the source. Read embedded text, tables, code, and meaningful image alt text before summarizing.

## Required response format

Use these headings and list syntax exactly. Omit a section only when the active project has no matching entries.

```markdown
TEMPLATES

TEMPLATE: Name

- 1 - Slide title - Summary

DECKS

DECK: Name

- 1 - Slide title - Summary
```

Number slides from 1 independently within each template or deck. Keep repeated slide titles as separate numbered entries. Do not add a preamble, source paths, implementation details, or closing commentary unless the user requests them.
