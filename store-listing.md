# Chrome Web Store listing

Source copy for the Redline Chrome Web Store submission. Paste each field into
the developer dashboard. The store does not render markdown, so the text below
is written for plain-text fields, line breaks only.

## Name

Redline

(If you want more search visibility, an option is "Redline: annotate webpages
for AI coding". Recommendation: keep it "Redline".)

## Summary (short description, 132 character limit)

Annotate any webpage and export a structured change request to Claude Code and other AI coding assistants.

## Category

Developer Tools

## Description

Redline turns a webpage into a precise change request.

You spot something to fix on a live site: a heading that should be bigger, a button in the wrong place, spacing that is off. Redline lets you mark it on the page and hand an exact, structured request to your AI coding assistant.

Activate Redline on any page. Drop a numbered callout on the element you want changed and describe the change. Or rewrite a heading or label directly on the page with the edit-text tool. Add boxes, arrows, and highlights for visual context. Then export. Redline captures an annotated screenshot and writes a markdown changelog where every numbered change is anchored to a precise DOM element, with its CSS selector, XPath, tag, classes, ARIA role, text, and position.

That structured export is the point. A vague "make the header better" gives an AI nothing to act on. Redline gives it an address for every change.

Redline is built for the Claude Code workflow. It ships a /redline slash command: save an export into your project, run /redline, and Claude Code finds each element in your source and applies the change. It also works with any assistant that can read an image and a markdown file.

How it works:
- Activate with a keyboard shortcut or the toolbar icon.
- Callout and Text place numbered, element-anchored change requests.
- Edit text rewrites an element's text in place; the export records the exact old text and new text.
- Rectangle, Ellipse, Arrow, Freehand, and Highlight add visual emphasis.
- Capture the visible area, or stitch the whole scrolling page.
- Export to the clipboard, or save the screenshot and changelog into a project folder.
- Annotations are saved per page, so you can pick up where you left off.

Private by design. No backend, no account, no telemetry. Redline runs entirely in your browser, and nothing you annotate or export leaves your computer.

Open source under GPL-3.0. Works on Chrome, Edge, Brave, and Arc.

## Single purpose

Redline lets a user annotate a webpage and export those annotations as a structured change request, an annotated screenshot plus a markdown changelog, for use with an AI coding assistant.

## Permission justifications

activeTab: Redline injects its annotation overlay only into the tab the user explicitly activates it on, and uses that grant to read the active tab's URL so it can refuse non-annotatable pages.

scripting: Used to inject the annotation overlay into the active page on demand, when the user activates Redline.

tabs: Used to capture a screenshot of the visible tab, which becomes the annotated export image.

storage: Stores the user's default color, stroke width, toolbar position, and per-page annotations locally on the device.

(Redline does not request broad host permissions. activeTab plus the user gesture that triggers activation is sufficient.)

## Data use

Redline does not collect, transmit, or sell any user data. It has no backend and no analytics. All annotations, settings, and exports stay on the user's device. In the data disclosure form, answer "does not collect" for every category.

## Still needed before submitting

- A Chrome Web Store developer account (one-time $5 registration fee).
- 1 to 5 screenshots, 1280x800 or 640x400. Capture the toolbar on a real page mid-annotation, and one of an export.
- Optional: a small promo tile, 440x280.
- The packaged zip: run pnpm zip.
- The privacy practices form (Redline collects nothing). A privacy policy URL is only required if data collection is ever added.
