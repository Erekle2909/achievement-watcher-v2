import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { NotificationPayload } from "./notification-manager.js";

const execAsync = promisify(exec);

export async function sendToast(payload: NotificationPayload): Promise<void> {
  const title = "Achievement Unlocked!";
  const message = `${payload.achievement.name} - ${payload.game.name}`;

  // Escape single quotes for PowerShell string literals
  const safeTitle = title.replace(/'/g, "''");
  const safeMessage = message.replace(/'/g, "''");

  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "$notify = New-Object System.Windows.Forms.NotifyIcon",
    "$notify.Icon = [System.Drawing.SystemIcons]::Information",
    "$notify.Visible = $true",
    `$notify.ShowBalloonTip(5000, '${safeTitle}', '${safeMessage}', 'Info')`,
    "Start-Sleep -Seconds 6",
    "$notify.Dispose()",
  ].join("; ");

  await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`).catch(() => {
    /* Toast failure is non-critical */
  });
}
