---
description: Apply the newest Redline change request (annotated screenshot + changelog) to this codebase.
argument-hint: "[path to a .redline folder or a specific export .md]"
---

You are applying a change request produced by the Redline browser extension. A
Redline export is a pair of files that share a slug: an annotated screenshot
(`*_redline.png`) and a markdown changelog (`*_redline.md`).

## 1. Locate the export

- If `$ARGUMENTS` is provided, treat it as the folder or the specific `.md`
  file to use.
- Otherwise search the project for Redline exports, in this order:
  1. a `.redline/` directory
  2. a `redline/` directory
  3. the repository root
- Pick the newest `*_redline.md`. The slug starts with an ISO date, so the
  newest one sorts last. State which file you chose.
- If no `*_redline.md` exists anywhere, stop and ask the user where the export
  is.

## 2. Read the request

- Read the chosen `.md` file in full. It has a metadata table, a "How to
  apply" contract, and a numbered list of changes.
- Read the matching `.png` (same slug) with the Read tool. The numbered
  markers in the image correspond to the numbered changes. Use it to
  understand visual intent (spacing, alignment, color, hierarchy) that the
  text alone cannot convey.

## 3. Apply each change

For each numbered change:

1. Locate the target element in the source code, not just the rendered DOM.
   The changelog gives several locators. Use them together:
   - the CSS `Selector` and `Selector path`
   - the `XPath` fallback
   - the `Element` line: grep the codebase for the id, the distinctive class
     names, or any `data-*` attributes
   - the `Current text`: grep for it. On a component framework it may be a
     prop or a string literal.
   - the `Nearby landmark`: it narrows down which section renders the element
2. Make the requested change. Keep it minimal and scoped. Do not refactor
   surrounding code or restyle unrelated elements.
3. If you cannot confidently identify the element, do not guess. Mark the item
   "Needs clarification" and say what you searched for.

## 4. Report

Print a numbered summary that mirrors the request:

- `1. Done: src/Header.tsx:42, made the heading bold`
- `2. Skipped: <reason>`
- `3. Needs clarification: <what is ambiguous>`

Do not commit. Leave the changes staged for the user to review.

## Notes

- Modern sites hash their class names (Tailwind, CSS modules, styled-
  components), so a rendered-DOM selector may not appear verbatim in the
  source. Trust the numbered intent and the element context over an exact
  selector match.
- The page may have changed since the screenshot was captured. Treat the
  screenshot as the source of truth for what the user wants to see.
- A "Visual emphasis" section, if present, lists non-numbered marks (boxes,
  arrows, highlights). Those are context only. Do not treat them as change
  requests.
