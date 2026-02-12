import { Activity, ActivitySquare, Settings } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { useMonitorStatus } from "../hooks/useMonitorStatus";
import { useScreenshotStore } from "../stores/screenshotStore";

interface StatusBarProps {
  onSettingsClick: () => void;
}

export function StatusBar({ onSettingsClick }: StatusBarProps) {
  const { isMonitoring, toggleMonitor } = useMonitorStatus();
  const screenshotCount = useScreenshotStore((s) => s.screenshots.length);
  const textCount = useScreenshotStore((s) => s.textEntries.length);
  const t = useScreenshotStore((s) => s.t);

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
          CLI Buddy
        </h1>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {screenshotCount} {t("screenshots")} · {textCount} {t("textEntries")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleMonitor}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors
            ${isMonitoring
              ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
              : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            }`}
        >
          {isMonitoring ? (
            <>
              <Activity size={12} className="animate-pulse" />
              {t("monitoring")}
            </>
          ) : (
            <>
              <ActivitySquare size={12} />
              {t("paused")}
            </>
          )}
        </button>

        <button
          onClick={() => open("https://github.com/xcryptp/cli-buddy")}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
          title="GitHub"
        >
          <img
            src="https://github.com/xcryptp.png"
            alt="xcryptp"
            className="h-5 w-5 rounded-full"
          />
        </button>

        <button
          onClick={onSettingsClick}
          className="rounded-md p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
          title={t("settings")}
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
