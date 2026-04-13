import { describe, it, expect } from "vitest";
import { parseSteamUserIdFromVdf } from "../steam-user.js";

describe("parseSteamUserIdFromVdf", () => {
  it("returns the MostRecent user when one is marked", () => {
    const vdf = `
"users"
{
  "76561198000000001"
  {
    "AccountName"		"user_one"
    "PersonaName"		"User One"
    "MostRecent"		"0"
  }
  "76561198000000002"
  {
    "AccountName"		"user_two"
    "PersonaName"		"User Two"
    "MostRecent"		"1"
  }
}`;
    expect(parseSteamUserIdFromVdf(vdf)).toBe("76561198000000002");
  });

  it("returns the first user when none is marked MostRecent", () => {
    const vdf = `
"users"
{
  "76561198000000001"
  {
    "AccountName"		"user_one"
    "MostRecent"		"0"
  }
  "76561198000000002"
  {
    "AccountName"		"user_two"
    "MostRecent"		"0"
  }
}`;
    expect(parseSteamUserIdFromVdf(vdf)).toBe("76561198000000001");
  });

  it("returns the only user when there is just one", () => {
    const vdf = `
"users"
{
  "76561198012345678"
  {
    "AccountName"		"solo_user"
    "MostRecent"		"1"
  }
}`;
    expect(parseSteamUserIdFromVdf(vdf)).toBe("76561198012345678");
  });

  it("returns null for empty content", () => {
    expect(parseSteamUserIdFromVdf("")).toBeNull();
  });

  it("returns null for VDF with no user IDs", () => {
    const vdf = `
"users"
{
}`;
    expect(parseSteamUserIdFromVdf(vdf)).toBeNull();
  });

  it("picks MostRecent from three users", () => {
    const vdf = `
"users"
{
  "76561198000000001"
  {
    "AccountName"		"alice"
    "MostRecent"		"0"
  }
  "76561198000000002"
  {
    "AccountName"		"bob"
    "MostRecent"		"0"
  }
  "76561198000000003"
  {
    "AccountName"		"charlie"
    "MostRecent"		"1"
  }
}`;
    expect(parseSteamUserIdFromVdf(vdf)).toBe("76561198000000003");
  });
});
