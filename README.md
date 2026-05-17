# Redline

Annotate live webpages and export structured change requests to Claude Code.

Redline is a Manifest V3 browser extension. Press the shortcut (or click the
toolbar icon), draw callouts on the page, label what should change, and export
an annotated screenshot plus a markdown changelog where every change is
anchored to a precise DOM element. Hand the export to Claude Code via the
`/redline` command, or paste it into any AI chat.

Status: Phase 1 (MVP) in development. Built with WXT + TypeScript. No backend,
no telemetry, all local.

## Development

```
pnpm install
pnpm dev        # WXT dev server (Chrome)
pnpm build      # production build to .output/chrome-mv3/
```

Then load `.output/chrome-mv3/` as an unpacked extension at `chrome://extensions`
(enable Developer mode first).

## License

MIT
