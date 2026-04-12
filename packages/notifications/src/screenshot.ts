/**
 * Screenshot capture stub.
 *
 * Actual implementation requires Electron's desktopCapturer API, which is not
 * available outside the Electron renderer/main process. Will be implemented
 * when the desktop app shell is built (Phase 7).
 */
export function captureScreenshot(): Promise<string | null> {
  // Screenshot capture requires Electron's desktopCapturer API, which is not
  // available outside the Electron renderer/main process. Will be implemented
  // when the desktop app shell is built (Phase 7).
  return Promise.resolve<string | null>(null);
}
