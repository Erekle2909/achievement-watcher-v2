import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendWebhook } from "../webhook.js";
import type { NotificationPayload } from "../notification-manager.js";

const mockPayload: NotificationPayload = {
  game: {
    id: "game-42",
    appId: "292030",
    name: "The Witcher 3",
    source: "gog",
    installPath: "C:/games/witcher3",
    playtime: 9999,
  },
  achievement: {
    id: "ach-7",
    name: "Card Collector",
    description: "Collect all Gwent cards",
    icon: "cards.png",
    unlocked: true,
    unlockTime: 1710000000,
  },
  timestamp: 1710000000,
};

interface WebhookBody {
  event: string;
  game: { appId: string; name: string };
  achievement: { id: string; name: string; description: string; unlockTime: number };
}

interface CapturedRequest {
  url: string;
  body: WebhookBody;
  method: string;
  contentType: string;
}

async function captureWebhookRequest(url: string): Promise<CapturedRequest> {
  let capturedUrl = "";
  let capturedBody: WebhookBody | undefined;
  let capturedMethod = "";
  let capturedContentType = "";

  vi.spyOn(globalThis, "fetch").mockImplementationOnce((_input, init) => {
    capturedUrl = url;
    capturedMethod = init?.method ?? "";
    const headers = init?.headers as Record<string, string> | undefined;
    capturedContentType = headers?.["Content-Type"] ?? "";
    capturedBody = JSON.parse(init?.body as string) as WebhookBody;
    return Promise.resolve(new Response(null, { status: 200 }));
  });

  await sendWebhook(mockPayload, url);

  return {
    url: capturedUrl,
    body: capturedBody as WebhookBody,
    method: capturedMethod,
    contentType: capturedContentType,
  };
}

describe("sendWebhook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs to the provided URL with JSON content-type", async () => {
    const result = await captureWebhookRequest("https://example.com/hook");
    expect(result.url).toBe("https://example.com/hook");
    expect(result.method).toBe("POST");
    expect(result.contentType).toBe("application/json");
  });

  it("sends correct event type in body", async () => {
    const result = await captureWebhookRequest("https://example.com/hook");
    expect(result.body.event).toBe("achievement:unlocked");
  });

  it("includes game appId and name in body", async () => {
    const result = await captureWebhookRequest("https://example.com/hook");
    expect(result.body.game.appId).toBe("292030");
    expect(result.body.game.name).toBe("The Witcher 3");
  });

  it("includes achievement fields in body", async () => {
    const result = await captureWebhookRequest("https://example.com/hook");
    expect(result.body.achievement.id).toBe("ach-7");
    expect(result.body.achievement.name).toBe("Card Collector");
    expect(result.body.achievement.description).toBe("Collect all Gwent cards");
    expect(result.body.achievement.unlockTime).toBe(1710000000);
  });

  it("does not throw when fetch rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));
    await expect(sendWebhook(mockPayload, "https://example.com/hook")).resolves.toBeUndefined();
  });

  it("does not throw when fetch returns a non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    await expect(sendWebhook(mockPayload, "https://example.com/hook")).resolves.toBeUndefined();
  });
});
