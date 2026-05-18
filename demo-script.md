# Redline demo script

Working doc for the Redline demo video. Target a 60 to 75 second cut,
landscape, captions-first. Every "Say" line doubles as the on-screen caption,
so the video works with voiceover or as text-only.

## Script

**1. Hook · 0:00-0:08**
- Screen: A live webpage of yours, still. Then Cmd+Shift+M, the Redline toolbar slides in.
- Say: "Fixing a website with an AI means describing every change in words. Which element, what to do, where it is. That's the slow part."

**2. What it is · 0:08-0:15**
- Screen: Cursor moves along the toolbar, tools visible.
- Say: "Redline skips the describing. It's a Chrome extension I built. You point at the page instead."

**3. Callout · 0:15-0:28**
- Screen: Press C. Click a heading. A numbered marker drops on it. Type a real instruction into the label box (e.g. "Make this heading larger and tighten the spacing below it").
- Say: "I pick the callout tool and click what I want changed. A numbered marker lands on the element. I type the instruction right there."

**4. Edit text · 0:28-0:43**
- Screen: Press D. Click a piece of text (a subheadline or a button label). It turns editable with a blue outline. Retype it to new words. Press Cmd+Enter. The page now shows the new text.
- Say: "Or I rewrite the text directly on the page. I click it, retype it, and Redline records the exact words, before and after."

**5. Export · 0:43-0:54**
- Screen: Click Save, pick a `.redline/` folder. Toast confirms. Quick cut to the saved `redline.md` open, scrolled to a change entry so the Selector and Old text / New text lines are visible.
- Say: "I export. Redline saves a screenshot and a changelog where every change is anchored to a real element: its selector, its position, the exact text."

**6. The loop · 0:54-1:06**
- Screen: Switch to Claude Code in the same project. Type `/redline`. Speed-ramp it running, then land on the per-item "Done" report.
- Say: "In Claude Code, I run slash redline. It reads the export, finds each element in my code, and applies every change."

**7. Payoff · 1:06-1:14**
- Screen: Refresh the webpage. The heading is bigger, the text is the new text. A before/after cut here lands hard.
- Say: "I refresh. The site is updated. I never opened my editor. I marked up the page and the code followed."

**8. CTA · 1:14-1:20**
- Screen: The GitHub repo page, or a clean Redline title card.
- Say: "Redline is free and open source. Link's in the comments."

## Before you record

- Pick a page from a real project of yours whose codebase Claude Code can edit. The two changes need to be visually obvious.
- Lock the two changes in advance. Callout = a layout or size change. Edit text = changing actual words. Edit text applies by exact string match, so it is the most reliable thing to show on camera.
- Install Redline (load unpacked) and install the `/redline` command into that project (toolbar terminal icon).
- Do one full dry run end to end. If `/redline` says "needs clarification" on a callout, the demo dies. Pick changes it will land cleanly.
- Hide the bookmarks bar, close noisy tabs, browser zoom at 100%.

## Recording notes

- Landscape 16:9, 1920x1080. A browser-plus-terminal demo does not crop to vertical.
- Burn in captions. LinkedIn autoplays muted, so the first frame has to carry the hook with no sound: hold the beat 1 line as on-screen text for about 2 seconds before anything moves.
- Speed-ramp the slow parts. Record the `/redline` run real, then run it 2 to 3x or jump-cut to the Done report. Never fake the result, just compress it.
- The webpage before/after is the hero shot. Give beat 7 the longest dwell, keep the terminal beat fast.
- Screen Studio (Mac) gives clean cursor auto-zoom and makes this look professional. QuickTime works for zero setup.
- Optional clarity caption on beat 7: "the on-page edit was a preview. /redline makes it real in the code." Use it only if people ask.

## LinkedIn caption

Short on purpose. The video carries the weight.

```
"Make the header better" is a useless instruction for an AI. It needs to
know which element, and exactly what to change.

So I built Redline.

It's a Chrome extension. You mark up any live webpage: drop notes on what
to change, or rewrite the text right on the page. It exports a change
request where every item is anchored to a real element. Then you run
/redline in Claude Code and it applies the whole thing to your code.

No backend, no account, nothing leaves your browser. Free and open source.

Full loop in the video. Repo's in the comments.

What would you point Redline at first?
```

## Posting strategy

Right now the only install is GitHub plus "load unpacked" (developer mode).
That is fine for the Claude Code crowd, who are most of the people this lands
with. A one-click Chrome Web Store link needs the developer account,
screenshots, and a review that takes days.

You do not have to wait. Post now with the GitHub link, then post again when
the Web Store link is live ("Redline is now on the Chrome Web Store"). One
tool, two content beats. Posting now does not spend the launch.
