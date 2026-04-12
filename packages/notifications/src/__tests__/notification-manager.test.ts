import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotificationManager } from "../notification-manager.js";
import type { NotificationPayload } from "../notification-manager.js";
import type { NotificationConfig } from "@achievement-watcher/shared";

// Mock all individual notification methods
vi.mock("../toast.js", () => ({ sendToast: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../sound.js", () => ({ playSound: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../webhook.js", () => ({ sendWebhook: vi.fn().mockResolvedValue(undefined) }));

import { sendToast } from "../toast.js";
import { playSound } from "../sound.js";
import { sendWebhook } from "../webhook.js";

const mockPayload: NotificationPayload = {
  game: {
    id: "game-1",
    appId: "570",
    name: "Dota 2",
    source: "steam",
    installPath: "C:/games/dota2",
    playtime: 12345,
  },
  achievement: {
    id: "ach-1",
    name: "First Blood",
    description: "Get first blood",
    icon: "firstblood.png",
    unlocked: true,
    unlockTime: 1700000000,
  },
  timestamp: 1700000000,
};

function makeConfig(overrides: Partial<NotificationConfig["enabled"]> = {}): NotificationConfig {
  return {
    enabled: {
      toast: false,
      sound: false,
      webhook: false,
      overlay: false,
      screenshot: false,
      ...overrides,
    },
    overlayDuration: 5000,
  };
}

describe("NotificationManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendToast when toast is enabled", async () => {
    const manager = createNotificationManager();
    await manager.notify(mockPayload, makeConfig({ toast: true }));
    expect(sendToast).toHaveBeenCalledOnce();
    expect(sendToast).toHaveBeenCalledWith(mockPayload);
  });

  it("does not call sendToast when toast is disabled", async () => {
    const manager = createNotificationManager();
    await manager.notify(mockPayload, makeConfig({ toast: false }));
    expect(sendToast).not.toHaveBeenCalled();
  });

  it("calls playSound when sound is enabled", async () => {
    const manager = createNotificationManager();
    await manager.notify(mockPayload, makeConfig({ sound: true }));
    expect(playSound).toHaveBeenCalledOnce();
  });

  it("passes customSoundPath to playSound", async () => {
    const manager = createNotificationManager();
    const config = makeConfig({ sound: true });
    config.customSoundPath = "C:/sounds/unlock.wav";
    await manager.notify(mockPayload, config);
    expect(playSound).toHaveBeenCalledWith("C:/sounds/unlock.wav");
  });

  it("calls sendWebhook when webhook is enabled and url is set", async () => {
    const manager = createNotificationManager();
    const config = makeConfig({ webhook: true });
    config.webhookUrl = "https://example.com/hook";
    await manager.notify(mockPayload, config);
    expect(sendWebhook).toHaveBeenCalledOnce();
    expect(sendWebhook).toHaveBeenCalledWith(mockPayload, "https://example.com/hook");
  });

  it("does not call sendWebhook when webhook is enabled but url is missing", async () => {
    const manager = createNotificationManager();
    await manager.notify(mockPayload, makeConfig({ webhook: true }));
    expect(sendWebhook).not.toHaveBeenCalled();
  });

  it("does not call sendWebhook when webhook is disabled", async () => {
    const manager = createNotificationManager();
    const config = makeConfig({ webhook: false });
    config.webhookUrl = "https://example.com/hook";
    await manager.notify(mockPayload, config);
    expect(sendWebhook).not.toHaveBeenCalled();
  });

  it("fires all enabled methods in parallel when all are enabled", async () => {
    const manager = createNotificationManager();
    const config = makeConfig({ toast: true, sound: true, webhook: true });
    config.webhookUrl = "https://example.com/hook";
    await manager.notify(mockPayload, config);
    expect(sendToast).toHaveBeenCalledOnce();
    expect(playSound).toHaveBeenCalledOnce();
    expect(sendWebhook).toHaveBeenCalledOnce();
  });

  it("still resolves if a method throws", async () => {
    vi.mocked(sendToast).mockRejectedValueOnce(new Error("toast failed"));
    const manager = createNotificationManager();
    await expect(manager.notify(mockPayload, makeConfig({ toast: true }))).resolves.toBeUndefined();
  });

  it("calls nothing when all methods are disabled", async () => {
    const manager = createNotificationManager();
    await manager.notify(mockPayload, makeConfig());
    expect(sendToast).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();
    expect(sendWebhook).not.toHaveBeenCalled();
  });
});
