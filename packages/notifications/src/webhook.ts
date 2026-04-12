import type { NotificationPayload } from "./notification-manager.js";

export async function sendWebhook(payload: NotificationPayload, url: string): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "achievement:unlocked",
      game: {
        appId: payload.game.appId,
        name: payload.game.name,
      },
      achievement: {
        id: payload.achievement.id,
        name: payload.achievement.name,
        description: payload.achievement.description,
        unlockTime: payload.timestamp,
      },
    }),
  }).catch(() => {
    /* Non-critical */
  });
}
