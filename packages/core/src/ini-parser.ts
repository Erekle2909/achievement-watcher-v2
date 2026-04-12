/**
 * Simple INI parser for Steam emulator achievement files.
 * Parses sections like:
 * [ACHIEVEMENT_NAME]
 * Achieved=1
 * UnlockTime=1700000000
 */
export function parseAchievementIni(content: string): Map<string, Record<string, string>> {
  const sections = new Map<string, Record<string, string>>();
  let currentSection = "";

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) continue;

    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!sections.has(currentSection)) {
        sections.set(currentSection, {});
      }
      continue;
    }

    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch && currentSection) {
      const section = sections.get(currentSection);
      if (section) {
        section[kvMatch[1].trim()] = kvMatch[2].trim();
      }
    }
  }

  return sections;
}
