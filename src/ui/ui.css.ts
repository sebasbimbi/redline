/** Styles for the Redline overlay UI. Injected as a <style> into the Shadow DOM. */
export const UI_CSS = `
:host { all: initial; }
* { box-sizing: border-box; }

.redline-toolbar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 5px;
  max-width: calc(100vw - 24px);
  padding: 6px;
  background: rgba(22, 22, 24, 0.92);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 11px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  line-height: 1;
  color: #ffffff;
  user-select: none;
  cursor: grab;
  touch-action: none;
}
.redline-toolbar.is-dragging { cursor: grabbing; }

.redline-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.redline-wordmark {
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0 6px;
}

.redline-tooltip {
  position: absolute;
  z-index: 2;
  left: 0;
  top: 0;
  /* size to the text, not to the gap left of the toolbar edge: an absolute
     box with only its left offset set otherwise shrink-wraps into that gap,
     which collapsed tooltips on right-side buttons into a narrow column */
  width: max-content;
  max-width: 232px;
  padding: 6px 9px;
  background: rgba(8, 8, 10, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 7px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  text-align: center;
  color: rgba(255, 255, 255, 0.94);
  white-space: normal;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-50%);
  transition: opacity 0.1s ease;
}
.redline-tooltip.is-visible {
  opacity: 1;
  visibility: visible;
}

.redline-divider {
  width: 1px;
  align-self: stretch;
  margin: 2px;
  background: rgba(255, 255, 255, 0.14);
}

.redline-btn {
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  margin: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  padding: 7px 11px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: background-color 0.12s ease;
}
.redline-btn:hover { background: rgba(255, 255, 255, 0.16); }
.redline-btn:disabled { opacity: 0.4; cursor: default; }
.redline-btn.is-active { background: #e5484d; }
.redline-btn.is-active:hover { background: #ec5d62; }
.redline-btn-primary { background: #0091ff; }
.redline-btn-primary:hover { background: #2aa1ff; }
.redline-btn-icon { width: 30px; height: 30px; padding: 0; }
.redline-btn svg { display: block; }

.redline-save-group { display: inline-flex; }
.redline-split-main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.redline-split-more {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: 1px;
  width: 24px;
  padding-left: 0;
  padding-right: 0;
  font-size: 10px;
}

.redline-swatch {
  appearance: none;
  -webkit-appearance: none;
  flex: none;
  width: 18px;
  height: 18px;
  padding: 0;
  margin: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.22);
  background: currentColor;
  cursor: pointer;
  transition: transform 0.1s ease, border-color 0.1s ease;
}
.redline-swatch:hover { transform: scale(1.12); }
.redline-swatch.is-active {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.45);
}

.redline-color-input {
  flex: none;
  width: 22px;
  height: 18px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.22);
  border-radius: 5px;
  background: none;
  cursor: pointer;
}
.redline-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}
.redline-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.redline-width {
  appearance: none;
  -webkit-appearance: none;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.12s ease;
}
.redline-width:hover { background: rgba(255, 255, 255, 0.16); }
.redline-width.is-active { background: rgba(255, 255, 255, 0.26); }
.redline-width-dot {
  display: block;
  border-radius: 50%;
  background: currentColor;
}

.redline-trigger {
  height: 30px;
  padding: 0 7px;
  gap: 4px;
}
.redline-trigger.is-open {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}
.redline-trigger-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}
.redline-trigger-swatch {
  display: block;
  flex: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
.redline-caret {
  font-size: 8px;
  line-height: 1;
  opacity: 0.5;
}

.redline-popover {
  position: absolute;
  z-index: 3;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px;
  background: rgba(22, 22, 24, 0.98);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 9px;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  cursor: default;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s ease;
}
.redline-popover.is-open {
  opacity: 1;
  visibility: visible;
}

.redline-label-editor {
  position: fixed;
  width: 284px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 11px;
  background: rgba(22, 22, 24, 0.97);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 11px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.46);
  pointer-events: auto;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #ffffff;
}
.redline-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}
.redline-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e5484d;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}
.redline-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.46);
}
.redline-label-editor textarea {
  width: 100%;
  resize: none;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 7px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.45;
  color: #ffffff;
  outline: none;
}
.redline-label-editor textarea:focus { border-color: #0091ff; }
.redline-label-editor textarea::placeholder { color: rgba(255, 255, 255, 0.38); }

.redline-panel {
  position: fixed;
  top: 60px;
  right: 12px;
  bottom: 12px;
  width: 264px;
  display: none;
  flex-direction: column;
  background: rgba(22, 22, 24, 0.95);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 11px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.46);
  pointer-events: auto;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #ffffff;
  overflow: hidden;
}
.redline-panel.is-open { display: flex; }
.redline-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  font-size: 13px;
  font-weight: 600;
}
.redline-panel-count { color: rgba(255, 255, 255, 0.45); font-weight: 400; }
.redline-panel-close {
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  cursor: pointer;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-family: inherit;
  font-size: 12px;
}
.redline-panel-close:hover { background: rgba(255, 255, 255, 0.14); color: #ffffff; }
.redline-panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.redline-panel-empty {
  padding: 22px 14px;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.4);
}
.redline-panel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}
.redline-panel-row:hover { background: rgba(255, 255, 255, 0.11); }
.redline-panel-row.is-selected {
  background: rgba(0, 145, 255, 0.20);
  outline: 1px solid rgba(0, 145, 255, 0.55);
}
.redline-panel-num {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.redline-panel-chip {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 5px;
}
.redline-panel-label {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.redline-panel-label.is-muted { color: rgba(255, 255, 255, 0.5); }
.redline-panel-act {
  flex: none;
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.redline-panel-act:hover { background: rgba(255, 255, 255, 0.16); color: #ffffff; }
.redline-panel-act svg { display: block; }

.redline-session-prompt {
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  width: 326px;
  padding: 14px 16px;
  background: rgba(22, 22, 24, 0.98);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #ffffff;
}
.redline-session-title { font-size: 13px; font-weight: 600; }
.redline-session-text {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}
.redline-session-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
.redline-session-actions button { flex: 1; }

.redline-toast-stack {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}
.redline-toast {
  max-width: 440px;
  padding: 9px 15px;
  background: rgba(22, 22, 24, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.35;
  color: #ffffff;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.redline-toast.is-visible { opacity: 1; transform: translateY(0); }
.redline-toast.is-error { border-color: rgba(229, 72, 77, 0.65); }

.redline-inspect-box {
  position: fixed;
  margin: 0;
  border: 2px solid #0091ff;
  border-radius: 2px;
  background: rgba(0, 145, 255, 0.12);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.55),
    inset 0 0 0 1px rgba(255, 255, 255, 0.55);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.08s ease;
}
.redline-inspect-box.is-visible {
  opacity: 1;
  visibility: visible;
}

.redline-inspect-label {
  position: fixed;
  width: max-content;
  max-width: 340px;
  padding: 5px 8px;
  background: rgba(8, 8, 10, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.35;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.08s ease;
}
.redline-inspect-label.is-visible {
  opacity: 1;
  visibility: visible;
}
.redline-inspect-name {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  word-break: break-all;
}
.redline-inspect-meta {
  margin-top: 1px;
  font-size: 11px;
  white-space: nowrap;
}
.redline-inspect-dims { color: #4db2ff; }
.redline-inspect-hint {
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.45);
}
`;
