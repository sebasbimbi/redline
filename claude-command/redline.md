---
description: Apply every pending Redline change request in this project to the codebase.
argument-hint: "[path to a .redline folder or a specific export .md]"
---

You are applying change requests produced by the Redline browser extension.
Each Redline export is a pair of files that share a slug: an annotated
screenshot (`*_redline.png`) and a markdown changelog (`*_redline.md`). A
project may hold several exports at once, one per annotated page. Apply all of
them.

## 1. Locate the exports

- If `$ARGUMENTS` names a specific `.md` file, use only that file.
- If `$ARGUMENTS` names a folder, use that folder.
- Otherwise search the project for the export folder, in this order:
  1. a `.redline/` directory
  2. a `redline/` directory
  3. the repository root
- Collect every `*_redline.md` file directly in that folder, not in its
  subfolders. An `applied/` subfolder holds exports a previous run already
  handled; leave it alone.
- Sort the files by name. The slug starts with an ISO date, so this applies
  the oldest page first.
- If no `*_redline.md` file exists anywhere, stop and ask the user where the
  export is.
- State how many exports you found and the order you will apply them in.

## 2. Apply each export

Work through the exports one at a time. For each one:

- Read the `.md` file in full. It has a metadata table, a "How to apply"
  contract, and a numbered list of changes.
- Read the matching `.png` (the same slug) with the Read tool. The numbered
  markers in the image correspond to the numbered changes. Use it for the
  visual intent (spacing, alignment, color, hierarchy) that text cannot
  convey.
- For each numbered change:
  1. Find the target element in the source code, not just the rendered DOM.
     The changelog gives several locators; use them together:
     - the CSS `Selector` and `Selector path`
     - the `XPath` fallback
     - the `Element` line: grep the codebase for the id, the distinctive
       class names, or any `data-*` attributes
     - the `Current text`: grep for it. On a component framework it may be a
       prop or a string literal.
     - the `Nearby landmark`: it narrows down which section renders it
  2. If the item is a text replacement (`Change type: text replacement`),
     search the source for the exact `Old text` string and replace it with
     the `New text`. Exact string search beats a selector here. Fall back to
     the selector only when the `Old text` is not found verbatim, for example
     when it is interpolated, split across lines, or a localization key. When
     the item says `Contains inline markup: yes`, keep the element's child
     markup and change only the text.
  3. Make the change. Keep it minimal and scoped. Do not refactor surrounding
     code or restyle unrelated elements.
  4. If you cannot confidently identify the element, do not guess. Mark the
     item "Needs clarification" and say what you searched for.

## 3. Mark each export done

After you finish an export, move its `.md` and `.png` into an `applied/`
subfolder of the export folder, creating the subfolder if needed. This keeps
the next `/redline` run from repeating finished work. Move the files; do not
delete them.

## 4. Report

Print one combined summary, grouped by export, that mirrors the requests:

```
acme-com_home_redline  (3 changes)
  1. Done: src/Header.tsx:42, made the heading bold
  2. Skipped: reason
  3. Needs clarification: what is ambiguous

acme-com_pricing_redline  (2 changes)
  1. Done: src/Pricing.tsx:18, raised the contrast
  2. Done: src/Pricing.tsx:30, aligned the cards
```

Do not commit. Leave the changes staged for the user to review.

## Notes

- Modern sites hash their class names (Tailwind, CSS modules,
  styled-components), so a rendered-DOM selector may not appear verbatim in
  the source. Trust the numbered intent and the element context over an exact
  selector match.
- The page may have changed since the screenshot was captured. Treat the
  screenshot as the source of truth for what the user wants to see.
- A "Visual emphasis" section, if present, lists non-numbered marks (boxes,
  arrows, highlights). Those are context only. Do not treat them as change
  requests.
