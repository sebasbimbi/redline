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
   choose Activate.
3. Click an element. A numbered marker drops and a label box opens. Type the
   change you want.
4. Add as many callouts as you need.
5. Export with the toolbar:
   - **Copy** puts the screenshot and changelog on the clipboard.
   - **Save** writes `{date}_{site}_redline.png` and `.md` into a folder you
     pick, and remembers it per site. The small caret next to Save chooses a
     different folder.
6. Press Esc to close Redline.

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

Phase 2. Working: callout tool, selector and metadata capture, viewport
screenshot, clipboard and folder-save export, the `/redline` command.
Planned: the remaining drawing tools, undo, full-page capture, and polish.

## License

MIT
