import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Read all DWORD values directly under a HKCU registry key using reg.exe.
 * Returns a map of value name → decimal string value.
 * Returns an empty map on any error (key not found, non-Windows OS, etc.).
 */
export async function readRegistryValues(hkcuPath: string): Promise<Record<string, string>> {
  try {
    const keyPath = `HKCU\\${hkcuPath.replace(/\//g, "\\")}`;
    const { stdout } = await execAsync(`reg query "${keyPath}" 2>nul`);
    const values: Record<string, string> = {};
    for (const line of stdout.split("\n")) {
      const match = line.trim().match(/^(\S+)\s+REG_DWORD\s+0x([0-9a-fA-F]+)/);
      if (match && match[1] && match[2]) {
        values[match[1]] = String(parseInt(match[2], 16));
      }
    }
    return values;
  } catch {
    return {};
  }
}
