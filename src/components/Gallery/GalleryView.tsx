import { Camera } from "lucide-react";
import { useScreenshotStore } from "../../stores/screenshotStore";
import { ThumbnailCard } from "./ThumbnailCard";

export function GalleryView() {
  const { screenshots, isLoading } = useScreenshotStore();
  const t = useScreenshotStore((s) => s.t);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">{t("loading")}</p>
      </div>
    );
  }

  if (screenshots.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Camera size={40} className="text-[var(--color-text-secondary)]/40" />
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("noScreenshots")}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]/60">
            {t("captureHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {screenshots.map((screenshot) => (
          <ThumbnailCard key={screenshot.filename} screenshot={screenshot} />
        ))}
      </div>
    </div>
  );
}
