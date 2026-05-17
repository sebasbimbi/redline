/**
 * Typed messages exchanged between the service worker, the overlay content
 * script, and the popup. Each message is discriminated on its `type` field.
 */

/** overlay -> service worker: capture the visible tab as a PNG data URL. */
export interface CaptureRequest {
  type: 'capture-viewport';
}
export interface CaptureResponse {
  ok: boolean;
  dataUrl?: string;
  error?: string;
}

/** popup -> service worker: inject (and thereby toggle) the overlay. */
export interface ActivateRequest {
  type: 'activate';
}
export interface ActivateResponse {
  ok: boolean;
  error?: string;
}

/** Any message the service worker may receive. */
export type RuntimeMessage = CaptureRequest | ActivateRequest;
