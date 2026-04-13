import { BrowserWindow } from "electron";

let overlayWindow: BrowserWindow | null = null;

export function showOverlay(data: {
  achievementName: string;
  gameName: string;
  duration: number; // ms
}): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }

  overlayWindow = new BrowserWindow({
    width: 400,
    height: 100,
    x: 50,
    y: 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Encode names safely for HTML embedding
  const safeName = data.achievementName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const safeGame = data.gameName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const html = `<html>
<body style="margin:0; background:transparent; font-family:Segoe UI,sans-serif;">
  <div style="
    background: rgba(15,15,15,0.95);
    border: 1px solid rgba(99,102,241,0.5);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
  ">
    <div style="font-size:28px;">&#x1F3C6;</div>
    <div>
      <div style="color:#a5b4fc; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
        Achievement Unlocked
      </div>
      <div style="color:#f4f4f5; font-size:15px; font-weight:600; margin-top:2px;">
        ${safeName}
      </div>
      <div style="color:#a1a1aa; font-size:12px;">
        ${safeGame}
      </div>
    </div>
  </div>
  <style>
    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  </style>
</body>
</html>`;

  void overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Auto-close after duration
  setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.close();
      overlayWindow = null;
    }
  }, data.duration);
}
