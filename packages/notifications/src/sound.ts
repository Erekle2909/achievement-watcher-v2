import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function playSound(customPath?: string): Promise<void> {
  if (customPath) {
    // Play custom WAV file via SoundPlayer
    const safePath = customPath.replace(/'/g, "''");
    const script = `(New-Object System.Media.SoundPlayer '${safePath}').PlaySync()`;
    await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`).catch(() => {
      /* Non-critical */
    });
  } else {
    // Default: Windows notification sound
    const script = `[System.Media.SystemSounds]::Asterisk.Play()`;
    await execAsync(`powershell -NoProfile -Command "${script}"`).catch(() => {
      /* Non-critical */
    });
  }
}
