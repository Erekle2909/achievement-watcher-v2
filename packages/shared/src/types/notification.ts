export type NotificationMethod = "toast" | "overlay" | "sound" | "screenshot" | "webhook";

export interface NotificationConfig {
  /** Which notification methods are enabled */
  enabled: Record<NotificationMethod, boolean>;
  /** Path to custom unlock sound (null = default) */
  customSoundPath?: string;
  /** Webhook URL for external integrations */
  webhookUrl?: string;
  /** Duration in ms for overlay popup */
  overlayDuration: number;
  /** Directory to save achievement screenshots */
  screenshotDir?: string;
}
