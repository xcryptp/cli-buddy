import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, X } from "lucide-react";
import type { AppSettings, Language } from "../types";
import { useScreenshotStore } from "../stores/screenshotStore";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl"
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
