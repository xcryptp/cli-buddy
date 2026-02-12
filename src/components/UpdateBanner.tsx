import { Download, X } from "lucide-react";
import { useUpdateCheck } from "../hooks/useUpdateCheck";
import { useScreenshotStore } from "../stores/screenshotStore";

export function UpdateBanner() {
  const { update, openRelease, dismiss } = useUpdateCheck();
  const language = useScreenshotStore((s) => s.language);

  if (!update) return null;

  const message =
    language === "ko"
      ? `새 버전 ${update.latestVersion} 사용 가능 (현재 v${update.currentVersion})`
      : `New version ${update.latestVersion} available (current v${update.currentVersion})`;

  const buttonText = language === "ko" ? "다운로드" : "Download";

  return (
    <div className="flex items-center justify-between bg-[var(--color-accent)] px-4 py-1.5">
      <span className="text-xs font-medium text-white">{message}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={openRelease}
          className="flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
        >
          <Download size={12} />
          {buttonText}
        </button>
        <button
          onClick={dismiss}
          className="rounded-md p-0.5 text-white/70 transition-colors hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
