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
}

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
`;
