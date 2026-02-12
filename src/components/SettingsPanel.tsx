import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, X } from "lucide-react";
import type { AppSettings, Language } from "../types";
import { useScreenshotStore } from "../stores/screenshotStore";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map browser key names to Tauri shortcut format
function keyEventToShortcut(e: KeyboardEvent): string | null {
  const modifiers: string[] = [];
  if (e.ctrlKey) modifiers.push("Ctrl");
  if (e.altKey) modifiers.push("Alt");
  if (e.shiftKey) modifiers.push("Shift");
  if (e.metaKey) modifiers.push("Super");

  // Ignore if only modifier keys pressed
  const key = e.key;
  if (["Control", "Alt", "Shift", "Meta"].includes(key)) return null;
  if (modifiers.length === 0) return null; // require at least one modifier

  // Map special keys
  const keyMap: Record<string, string> = {
    " ": "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Escape: "Escape",
    Enter: "Enter",
    Backspace: "Backspace",
    Delete: "Delete",
    Tab: "Tab",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
    Insert: "Insert",
  };

  let mappedKey = keyMap[key] || key.toUpperCase();

  // Function keys
  if (/^F\d+$/.test(key)) mappedKey = key;

  return [...modifiers, mappedKey].join("+");
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const t = useScreenshotStore((s) => s.t);
  const setLanguage = useScreenshotStore((s) => s.setLanguage);

  useEffect(() => {
    if (isOpen) {
      invoke<AppSettings>("get_settings").then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await invoke("update_settings", { newSettings: settings });
      setLanguage(settings.language as Language);
      onClose();
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSaving(false);
    }
  }, [settings, setLanguage, onClose]);

  const updateField = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  // Shortcut recorder
  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const shortcut = keyEventToShortcut(e);
      if (shortcut) {
        updateField("global_shortcut", shortcut);
        setRecording(false);
      }
    };
    const cancelHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRecording(false);
      }
    };
    window.addEventListener("keydown", handler, true);
    window.addEventListener("keyup", cancelHandler, true);
    return () => {
      window.removeEventListener("keydown", handler, true);
      window.removeEventListener("keyup", cancelHandler, true);
    };
  }, [recording]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-[var(--color-text-secondary)]" />
            <h2 className="text-sm font-semibold">{t("settings")}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {settings && (
          <div className="space-y-4 p-5">
            {/* Language */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("language")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateField("language", "ko")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    settings.language === "ko"
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => updateField("language", "en")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    settings.language === "en"
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Path Format */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("pathFormat")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateField("path_format", "windows")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    settings.path_format === "windows"
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  {t("pathWindows")}
                </button>
                <button
                  onClick={() => updateField("path_format", "wsl")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    settings.path_format === "wsl"
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  {t("pathWsl")}
                </button>
              </div>
            </div>

            {/* Save Directory */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("saveDirectory")}
              </label>
              <input
                type="text"
                value={settings.save_directory}
                onChange={(e) => updateField("save_directory", e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Polling Interval */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("pollingInterval")}
              </label>
              <input
                type="number"
                min={200}
                max={5000}
                step={100}
                value={settings.polling_interval_ms}
                onChange={(e) =>
                  updateField("polling_interval_ms", parseInt(e.target.value) || 500)
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Max Screenshots */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("maxScreenshots")}
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={settings.max_screenshots}
                onChange={(e) =>
                  updateField("max_screenshots", parseInt(e.target.value) || 100)
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Max Text Entries */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("maxTextEntries")}
              </label>
              <input
                type="number"
                min={10}
                max={500}
                value={settings.max_text_entries}
                onChange={(e) =>
                  updateField("max_text_entries", parseInt(e.target.value) || 50)
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Global Shortcut - Key Recorder */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                {t("globalShortcut")}
              </label>
              <button
                onClick={() => setRecording(true)}
                className={`w-full rounded-md border px-3 py-1.5 text-left text-xs transition-colors ${
                  recording
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/50"
                }`}
              >
                {recording
                  ? settings.language === "ko"
                    ? "키 조합을 눌러주세요... (ESC: 취소)"
                    : "Press a key combination... (ESC: cancel)"
                  : settings.global_shortcut || "Alt+Shift+V"}
              </button>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {t("autoCopyPath")}
                </span>
                <input
                  type="checkbox"
                  checked={settings.auto_copy_path}
                  onChange={(e) => updateField("auto_copy_path", e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--color-accent)]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {t("captureText")}
                </span>
                <input
                  type="checkbox"
                  checked={settings.capture_text}
                  onChange={(e) => updateField("capture_text", e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--color-accent)]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {t("autoStart")}
                </span>
                <input
                  type="checkbox"
                  checked={settings.auto_start}
                  onChange={(e) => updateField("auto_start", e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--color-accent)]"
                />
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-[var(--color-border)] px-5 py-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
