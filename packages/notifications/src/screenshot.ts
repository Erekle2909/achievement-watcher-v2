import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

const execAsync = promisify(exec);

export async function captureScreenshot(saveDir: string): Promise<string | null> {
  if (!existsSync(saveDir)) {
    mkdirSync(saveDir, { recursive: true });
  }

  const filename = `achievement-${String(Date.now())}.png`;
  const filePath = join(saveDir, filename);

  // Escape backslashes for embedding the path inside a PowerShell string literal
  const escapedPath = filePath.replace(/\\/g, "\\\\");

  const scriptLines = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "Add-Type -AssemblyName System.Drawing",
    "$screen = [System.Windows.Forms.Screen]::PrimaryScreen",
    "$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)",
    "$graphics = [System.Drawing.Graphics]::FromImage($bitmap)",
    "$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)",
    `$bitmap.Save('${escapedPath}', [System.Drawing.Imaging.ImageFormat]::Png)`,
    "$graphics.Dispose()",
    "$bitmap.Dispose()",
  ];

  const script = scriptLines.join("; ");

  try {
    await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`);
    return existsSync(filePath) ? filePath : null;
  } catch {
    return null;
  }
}
