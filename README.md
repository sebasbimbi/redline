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
   and links to the browser's shortcut settings.
3. Pick a tool from the toolbar (or press its shortcut key):
   - **Callout** (C) drops a numbered marker on an element and opens a box for
     the change you want. **Text** (T) places an editable note. Both are
     element-anchored and appear in the exported changelog.
   - **Rectangle** (R), **Ellipse** (E), **Arrow** (A), **Freehand** (F), and
     **Highlight** (H) are visual emphasis: drawn on the screenshot, but they
     do not create changelog entries.
   - **Select** (V) picks an annotation. Drag to move it, press Delete to
     remove it, double-click a callout or note to re-edit its label.
4. Undo and redo with the toolbar arrows or Cmd/Ctrl+Z. Pick a color and
   stroke width from the toolbar; Clear removes everything.
5. The panel button on the toolbar opens a list of every annotation. Click a
   row to jump to it, the pencil to edit a label, the cross to delete it.
   Annotations are saved per page: reopen Redline on the same page and it
   offers to resume them.
6. Export with the toolbar:
   - **Copy** puts the screenshot and changelog on the clipboard.
   - **Save** writes `{date}_{site}_redline.png` and `.md` into a folder you
     pick, and remembers it per site. The small caret next to Save chooses a
     different folder.
7. Press Esc to close Redline.

## The /redline Claude Code loop

Redline ships a slash command so Claude Code can apply an export directly.

One-time setup, per project: copy the command file into the project's
`.claude/commands/` folder.

```
cp claude-command/redline.md /path/to/your-project/.claude/commands/
```

Then, each time:

1. In Redline, annotate the page and click **Save**. Point the folder picker
   at a `.redline/` folder inside the project you are working on.
2. In Claude Code, inside that project, run `/redline`.
3. Claude Code reads the newest export pair, applies each change to your
   source, and reports on every item.

## Development

```
pnpm dev        # WXT dev server with live reload
pnpm build      # production build into output/chrome-mv3/
pnpm compile    # type-check only
```

## Status

Phase 4. Working: all seven annotation tools (callout, text, rectangle,
ellipse, arrow, freehand, highlight), select and move, undo and redo, an
annotation panel, per-page session persistence, popup settings, selector and
metadata capture, viewport screenshot, clipboard and folder-save export, the
`/redline` command. Planned: full-page capture and release polish.

## License

MIT
