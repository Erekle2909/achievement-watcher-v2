import { homedir } from "node:os";
import { join } from "node:path";
import type { Achievement, GameEntry, NotificationConfig } from "@achievement-watcher/shared";
import { sendToast } from "./toast.js";
import { playSound } from "./sound.js";
import { sendWebhook } from "./webhook.js";
import { captureScreenshot } from "./screenshot.js";

export interface NotificationPayload {
  game: GameEntry;
  achievement: Achievement;
  timestamp: number;
}

export interface NotificationManager {
  notify(payload: NotificationPayload, config: NotificationConfig): Promise<void>;
}

export function createNotificationManager(): NotificationManager {
  return {
    async notify(payload, config) {
      const tasks: Promise<void>[] = [];

      if (config.enabled.toast) tasks.push(sendToast(payload));
      if (config.enabled.sound) tasks.push(playSound(config.customSoundPath));
      if (config.enabled.webhook && config.webhookUrl)
        tasks.push(sendWebhook(payload, config.webhookUrl));
      if (config.enabled.screenshot) {
        const saveDir =
          config.screenshotDir ?? join(homedir(), ".achievement-watcher", "screenshots");
        tasks.push(captureScreenshot(saveDir).then(() => undefined));
      }

      await Promise.allSettled(tasks);
    },
  };
}
