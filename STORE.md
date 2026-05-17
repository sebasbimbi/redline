# Chrome Web Store listing

Reference copy for publishing Redline to the Chrome Web Store. Screenshots and
promotional tiles have to be captured by hand before submission; everything
else is below.

## Identity

- Name: Redline
- Category: Developer Tools
- Summary (132 characters max):
  Annotate any webpage and export structured change requests to Claude Code
  and other AI coding assistants.

## Description

Redline turns a live webpage into a change request. Activate it on any page,
drop numbered callouts on the elements you want changed, and label each one.
Redline captures a screenshot and builds a markdown changelog where every
callout is anchored to a precise DOM element: CSS selector, XPath, tag,
classes, ARIA, text, and bounding box. An AI coding assistant then has an
address for each change, not a vague description.

Tools: numbered callouts and text notes (element-anchored, exported to the
changelog), plus rectangle, ellipse, arrow, freehand, and highlight for visual
emphasis. Select and move any annotation, undo and redo, and review everything
in a side panel. Export the visible viewport, or stitch the whole scrolling
page into one tall screenshot. Send it to the clipboard or save it into a
project folder.

Redline ships a `/redline` slash command so Claude Code can read an export and
apply the changes directly.

No backend, no telemetry, no account. Everything runs locally.

## Permission justifications

- activeTab: inject the annotation overlay into the page the user activates
  Redline on.
- scripting: inject that overlay programmatically, only when asked, so the
  extension is zero-cost on every other page.
- tabs: read the active tab's URL to refuse pages that cannot be annotated,
  and capture the visible tab as the screenshot.
- storage: save the user's default color and stroke, and remember
  in-progress annotations per page so a session can be resumed.
- host permissions (http, https): the overlay must be able to run on any
  ordinary website the user chooses to annotate.

## Privacy

Redline collects nothing and sends nothing. Screenshots, annotations, and
settings never leave the user's machine. There is no analytics, no account,
and no remote server.

## Before submitting

- Capture store screenshots (1280x800) of the overlay in use.
- Build the package with `pnpm zip`, then upload the zip from `output/`.
