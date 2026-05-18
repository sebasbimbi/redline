# Redline

Annotate live webpages and export structured change requests to Claude Code.

Redline is a Manifest V3 browser extension. Activate it on any page, drop
numbered callouts on the elements you want changed, and label each one. Redline
captures a screenshot and builds a markdown changelog where every callout is
anchored to a precise DOM element: CSS selector, XPath, tag, classes, ARIA,
text, and bounding box. An AI coding assistant then has an address for each
change, not a vague description.

No backend, no telemetry, no account. Everything runs locally. Built with WXT
and TypeScript. Works on Chrome, Edge, Brave, and Arc.

## Install (unpacked)

```
pnpm install
pnpm build
```

In `chrome://extensions` (or `arc://extensions`):

1. Enable Developer mode.
2. Click "Load unpacked" and select the `output/chrome-mv3/` folder.

## Use it

1. Open a normal web page (http or https, not `chrome://` pages or the Web
   Store).
2. Press Cmd+Shift+M (Mac) or Ctrl+Shift+M, or click the Redline icon and
   choose Activate. The icon's popup also sets your default color and stroke,
   and links to the browser's shortcut settings. The toolbar can be dragged
   anywhere on the page.
3. Pick a tool from the toolbar, or press its shortcut key:
   - **Callout** (C) drops a numbered marker on an element and opens a box for
     the change you want. **Text** (T) places an editable note. Both are
     element-anchored and appear in the exported changelog. While you place
     one, the Up and Down arrow keys walk the DOM tree to target the exact
     element.
   - The **shapes** button opens **Rectangle** (R), **Ellipse** (E), **Arrow**
     (A), **Freehand** (F), and **Highlight** (H). These are visual emphasis:
     drawn on the screenshot, but they do not create changelog entries.
   - **Select** (V) picks an annotation. Drag to move it, press Delete to
     remove it, double-click a callout or note to re-edit its label.
4. The color and stroke-width buttons each open a picker. Undo and redo with
   the toolbar arrows or Cmd/Ctrl+Z; Clear removes every annotation.
5. The panel button on the toolbar opens a list of every annotation. Click a
   row to jump to it, the pencil to edit a label, the cross to delete it.
   Annotations are saved per page: reopen Redline on the same page and it
   offers to resume them.
6. Export with the toolbar:
   - **Copy** puts the screenshot and changelog on the clipboard.
   - **Save** writes `{date}_{site}_redline.png` and `.md` into a folder you
     pick, and remembers it per site. The small caret next to Save chooses a
     different folder.
   - The full-page button switches Copy and Save between the visible area and
     a stitched screenshot of the whole scrolling page.
7. Press Esc to close Redline.

## The /redline Claude Code loop

Redline ships a slash command so Claude Code can apply an export directly.

One-time setup, per project: in the Redline toolbar, click the install
command button (the terminal icon) and pick your project folder. Redline
writes the command into `.claude/commands/` for you.

By hand instead, if you prefer:

```
cp claude-command/redline.md /path/to/your-project/.claude/commands/
```

Then, each time:

1. In Redline, annotate a page and click **Save**, pointing the folder picker
   at a `.redline/` folder in the project. Repeat for as many pages as you
   like; each page is saved as its own export.
2. In Claude Code, inside that project, run `/redline`.
3. Claude Code applies every pending export in the folder, page by page,
   reports on each item, and moves the applied exports into `.redline/applied/`.

## Permissions

Redline requests only what it needs, and all of it stays on your machine:

- **activeTab** and **scripting** let Redline inject its annotation overlay
  into the page you activate it on. It injects nothing until you activate it.
- **tabs** lets Redline capture the visible tab as the screenshot.
- **storage** keeps your default color, stroke width, toolbar position, and
  per-page annotations.
- The `http` and `https` host permissions let you activate Redline on any
  normal site.

There is no server and no telemetry. Nothing you annotate or export leaves
your computer.

## Development

```
pnpm dev        # WXT dev server with live reload
pnpm build      # production build into output/chrome-mv3/
pnpm compile    # type-check only
pnpm test       # run the vitest suite
pnpm zip        # packaged .zip for the Chrome Web Store
pnpm icons      # regenerate the extension icons
```

## Status

Version 1.1.1. Seven annotation tools (callout, text, rectangle, ellipse,
arrow, freehand, highlight), select and move, undo and redo, an annotation
panel, per-page session persistence, popup settings, viewport and full-page
capture, clipboard and folder-save export, and the `/redline` command. The
toolbar is draggable and groups its shape, color, and width pickers into
popovers. The overlay pierces open shadow DOM when picking elements and
recovers cleanly if the extension is reloaded. The export and model logic is
covered by a vitest test suite.

## License

[GPL-3.0-or-later](LICENSE). Redline is free software; any distributed
derivative must also be released as open source under the same license.
