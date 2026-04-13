import { describe, it, expect } from "vitest";
import { extractVdfValue } from "../game-discovery.js";

describe("extractVdfValue", () => {
  const sampleManifest = `
"AppState"
{
  "appid"		"220"
  "Universe"		"1"
  "name"		"Half-Life 2"
  "StateFlags"		"4"
  "installdir"		"Half-Life 2"
  "LastUpdated"		"1614556890"
  "SizeOnDisk"		"4443222333"
  "buildid"		"6905309"
  "LastOwner"		"76561198012345678"
}`;

  it("extracts appid", () => {
    expect(extractVdfValue(sampleManifest, "appid")).toBe("220");
  });

  it("extracts name", () => {
    expect(extractVdfValue(sampleManifest, "name")).toBe("Half-Life 2");
  });

  it("extracts installdir", () => {
    expect(extractVdfValue(sampleManifest, "installdir")).toBe("Half-Life 2");
  });

  it("is case-insensitive for key matching", () => {
    expect(extractVdfValue(sampleManifest, "AppID")).toBe("220");
    expect(extractVdfValue(sampleManifest, "NAME")).toBe("Half-Life 2");
  });

  it("returns null for missing keys", () => {
    expect(extractVdfValue(sampleManifest, "nonexistent")).toBeNull();
  });

  it("returns null for empty content", () => {
    expect(extractVdfValue("", "appid")).toBeNull();
  });

  it("handles single-space formatting", () => {
    const compact = '"appid" "440"';
    expect(extractVdfValue(compact, "appid")).toBe("440");
  });

  it("handles tab-separated formatting", () => {
    const tabbed = '"appid"\t\t"730"';
    expect(extractVdfValue(tabbed, "appid")).toBe("730");
  });
});
