import { useState } from "react";
import { DEFAULT_SETTINGS } from "@achievement-watcher/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThemeMode = "dark" | "light" | "system";

interface NotificationEnabled {
  toast: boolean;
  overlay: boolean;
  sound: boolean;
  screenshot: boolean;
  webhook: boolean;
}

interface LocalSettings {
  notifications: {
    enabled: NotificationEnabled;
    customSoundPath: string;
    webhookUrl: string;
    overlayDuration: number;
  };
  scanPaths: string[];
  enabledPlugins: string[];
  theme: ThemeMode;
  accentColor: string;
  steamApiKey: string;
  rescanInterval: number;
  startMinimized: boolean;
  startOnBoot: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_PLUGINS: { id: string; name: string; source: string }[] = [
  { id: "steam", name: "Steam", source: "native" },
  { id: "goldberg", name: "Goldberg SteamEmu", source: "steam-emu" },
  { id: "codex", name: "CODEX", source: "steam-emu" },
  { id: "empress", name: "EMPRESS", source: "steam-emu" },
  { id: "skidrow", name: "SKIDROW", source: "steam-emu" },
  { id: "ali213", name: "Ali213", source: "steam-emu" },
  { id: "creamapi", name: "CreamAPI", source: "steam-emu" },
  { id: "rpcs3", name: "RPCS3", source: "emulator" },
  { id: "uplay-r1", name: "Uplay R1", source: "ubisoft" },
  { id: "uplay-r2", name: "Uplay R2", source: "ubisoft" },
  { id: "retroarch", name: "RetroArch", source: "emulator" },
];

const ACCENT_PRESETS: { label: string; value: string; bg: string; ring: string }[] = [
  { label: "Indigo", value: "#6366f1", bg: "bg-indigo-500", ring: "ring-indigo-400" },
  { label: "Blue", value: "#3b82f6", bg: "bg-blue-500", ring: "ring-blue-400" },
  { label: "Green", value: "#22c55e", bg: "bg-green-500", ring: "ring-green-400" },
  { label: "Purple", value: "#a855f7", bg: "bg-purple-500", ring: "ring-purple-400" },
  { label: "Pink", value: "#ec4899", bg: "bg-pink-500", ring: "ring-pink-400" },
  { label: "Amber", value: "#f59e0b", bg: "bg-amber-500", ring: "ring-amber-400" },
];

const RESCAN_OPTIONS: { label: string; value: number }[] = [
  { label: "Manual only", value: 0 },
  { label: "Every 1 minute", value: 1 },
  { label: "Every 5 minutes", value: 5 },
  { label: "Every 15 minutes", value: 15 },
  { label: "Every 30 minutes", value: 30 },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface RowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function Row({ label, description, children }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm text-zinc-200">{label}</span>
        {description && <span className="text-xs text-zinc-500">{description}</span>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      } ${checked ? "bg-indigo-500" : "bg-zinc-700"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Build initial state from DEFAULT_SETTINGS
// ---------------------------------------------------------------------------

function buildInitialState(): LocalSettings {
  return {
    notifications: {
      enabled: { ...DEFAULT_SETTINGS.notifications.enabled },
      customSoundPath: "",
      webhookUrl: "",
      overlayDuration: DEFAULT_SETTINGS.notifications.overlayDuration,
    },
    scanPaths: [...DEFAULT_SETTINGS.scanPaths],
    enabledPlugins: [...DEFAULT_SETTINGS.enabledPlugins],
    theme: DEFAULT_SETTINGS.theme as ThemeMode,
    accentColor: DEFAULT_SETTINGS.accentColor,
    steamApiKey: "",
    rescanInterval: DEFAULT_SETTINGS.rescanInterval,
    startMinimized: DEFAULT_SETTINGS.startMinimized,
    startOnBoot: DEFAULT_SETTINGS.startOnBoot,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Settings() {
  const [settings, setSettings] = useState<LocalSettings>(buildInitialState);
  const [newScanPath, setNewScanPath] = useState("");
  const [showSteamKey, setShowSteamKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Helper: patch a top-level key
  function patch<K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function patchNotification<K extends keyof LocalSettings["notifications"]>(
    key: K,
    value: LocalSettings["notifications"][K],
  ) {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  }

  function toggleNotificationMethod(method: keyof NotificationEnabled) {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        enabled: {
          ...prev.notifications.enabled,
          [method]: !prev.notifications.enabled[method],
        },
      },
    }));
  }

  function togglePlugin(id: string) {
    setSettings((prev) => {
      const has = prev.enabledPlugins.includes(id);
      return {
        ...prev,
        enabledPlugins: has
          ? prev.enabledPlugins.filter((p) => p !== id)
          : [...prev.enabledPlugins, id],
      };
    });
  }

  function addScanPath() {
    const trimmed = newScanPath.trim();
    if (!trimmed || settings.scanPaths.includes(trimmed)) return;
    patch("scanPaths", [...settings.scanPaths, trimmed]);
    setNewScanPath("");
  }

  function removeScanPath(path: string) {
    patch(
      "scanPaths",
      settings.scanPaths.filter((p) => p !== path),
    );
  }

  function handleSave() {
    // TODO: wire to window.electronAPI?.updateSettings(settings)
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "achievement-watcher-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as LocalSettings;
          setSettings(parsed);
        } catch {
          // silently ignore bad JSON — could add an error toast here later
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const notificationMethods: { key: keyof NotificationEnabled; label: string; desc: string }[] = [
    { key: "toast", label: "Toast notifications", desc: "OS-level popup when achievement unlocks" },
    { key: "overlay", label: "In-game overlay", desc: "Floating card drawn over the game window" },
    { key: "sound", label: "Unlock sound", desc: "Play a sound on each unlock" },
    { key: "screenshot", label: "Screenshot", desc: "Auto-capture screenshot on unlock" },
    { key: "webhook", label: "Webhook", desc: "POST achievement data to an external URL" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Settings</h2>
          <p className="text-sm text-zinc-500 mt-1">Configure achievement tracking preferences.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved ? "bg-green-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Notification Preferences                                            */}
      {/* ------------------------------------------------------------------ */}
      <Section
        title="Notification Preferences"
        description="Choose how you are notified when an achievement unlocks."
      >
        {notificationMethods.map(({ key, label, desc }) => (
          <Row key={key} label={label} description={desc}>
            <Toggle
              checked={settings.notifications.enabled[key]}
              onChange={() => {
                toggleNotificationMethod(key);
              }}
            />
          </Row>
        ))}
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Custom Sound                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Section
        title="Custom Sound"
        description="Override the default unlock sound with your own audio file."
      >
        <Row label="Sound file path" description="Absolute path to an .mp3, .wav, or .ogg file">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={settings.notifications.customSoundPath}
              onChange={(e) => {
                patchNotification("customSoundPath", e.target.value);
              }}
              placeholder="C:\sounds\unlock.wav"
              className="w-72 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
              onClick={() => {
                patchNotification("customSoundPath", "");
              }}
            >
              Clear
            </button>
          </div>
        </Row>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Webhook                                                             */}
      {/* ------------------------------------------------------------------ */}
      <Section
        title="Webhook URL"
        description="Receive a POST request with achievement data when an unlock happens."
      >
        <Row label="Endpoint URL" description="Must return 2xx to be considered successful">
          <input
            type="url"
            value={settings.notifications.webhookUrl}
            onChange={(e) => {
              patchNotification("webhookUrl", e.target.value);
            }}
            placeholder="https://example.com/webhook"
            className="w-80 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </Row>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Scan Paths                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Section
        title="Scan Paths"
        description="Directories that will be scanned for game save data."
      >
        {/* Existing paths */}
        {settings.scanPaths.length > 0 ? (
          <div className="flex flex-col gap-2">
            {settings.scanPaths.map((p) => (
              <div
                key={p}
                className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2"
              >
                <span className="flex-1 text-sm text-zinc-200 font-mono truncate">{p}</span>
                <button
                  type="button"
                  onClick={() => {
                    removeScanPath(p);
                  }}
                  className="text-zinc-500 hover:text-red-400 transition-colors text-sm"
                  aria-label={`Remove ${p}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 italic">No scan paths added yet.</p>
        )}

        {/* Add new */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newScanPath}
            onChange={(e) => {
              setNewScanPath(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") addScanPath();
            }}
            placeholder="C:\Users\YourName\AppData\Roaming"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addScanPath}
            disabled={!newScanPath.trim()}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            Add
          </button>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Plugin Management                                                   */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Plugin Management" description="Enable or disable individual parser plugins.">
        {ALL_PLUGINS.map((plugin) => (
          <Row
            key={plugin.id}
            label={plugin.name}
            description={`Source: ${plugin.source} · ID: ${plugin.id}`}
          >
            <Toggle
              checked={settings.enabledPlugins.includes(plugin.id)}
              onChange={() => {
                togglePlugin(plugin.id);
              }}
            />
          </Row>
        ))}
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Appearance                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Appearance" description="Theme and accent color preferences.">
        {/* Theme */}
        <Row label="Theme" description="Controls light/dark mode for the app window">
          <div className="flex items-center gap-3">
            {(["dark", "light", "system"] as ThemeMode[]).map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={settings.theme === t}
                  onChange={() => {
                    patch("theme", t);
                  }}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-zinc-300 capitalize">{t}</span>
              </label>
            ))}
          </div>
        </Row>

        {/* Accent Color */}
        <Row label="Accent color" description="Primary highlight color throughout the UI">
          <div className="flex items-center gap-2">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.label}
                onClick={() => {
                  patch("accentColor", preset.value);
                }}
                className={`w-7 h-7 rounded-full ${preset.bg} transition-all ${
                  settings.accentColor === preset.value
                    ? `ring-2 ring-offset-2 ring-offset-zinc-900 ${preset.ring}`
                    : "opacity-60 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </Row>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Steam API Key                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Section
        title="Steam API Key"
        description="Required for fetching achievement metadata from Steam. Stored encrypted."
      >
        <Row label="API key" description="Get yours at steamcommunity.com/dev/apikey">
          <div className="flex items-center gap-2">
            <input
              type={showSteamKey ? "text" : "password"}
              value={settings.steamApiKey}
              onChange={(e) => {
                patch("steamApiKey", e.target.value);
              }}
              placeholder="Your Steam Web API key"
              className="w-72 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                setShowSteamKey((v) => !v);
              }}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
            >
              {showSteamKey ? "Hide" : "Show"}
            </button>
          </div>
        </Row>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Scanning                                                            */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Scanning" description="Control how often the engine re-scans for changes.">
        <Row label="Rescan interval" description="Automatic rescan frequency">
          <select
            value={settings.rescanInterval}
            onChange={(e) => {
              patch("rescanInterval", Number(e.target.value));
            }}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {RESCAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Startup                                                             */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Startup" description="Control app behavior at system boot.">
        <Row label="Start minimized" description="Launch directly to the system tray">
          <Toggle
            checked={settings.startMinimized}
            onChange={(v) => {
              patch("startMinimized", v);
            }}
          />
        </Row>
        <Row label="Start on boot" description="Launch automatically when Windows starts">
          <Toggle
            checked={settings.startOnBoot}
            onChange={(v) => {
              patch("startOnBoot", v);
            }}
          />
        </Row>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Data                                                                */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Data" description="Import or export your full settings as a JSON backup.">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors"
          >
            Import JSON
          </button>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* About                                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section title="About">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Version</span>
            <span className="text-sm text-zinc-200 font-mono">2.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">GitHub</span>
            <a
              href="https://github.com/achievement-watcher/achievement-watcher-v2"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              github.com/achievement-watcher
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
