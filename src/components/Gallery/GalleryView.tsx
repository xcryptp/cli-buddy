import { Camera, Type } from "lucide-react";
import { useScreenshotStore } from "../../stores/screenshotStore";
import { ThumbnailCard } from "./ThumbnailCard";
import { TextCard } from "./TextCard";
import type { FilterMode } from "../../types";

const filterModes: FilterMode[] = ["all", "images", "text"];

export function GalleryView() {
  const { screenshots, textEntries, filterMode, isLoading } =
    useScreenshotStore();
  const t = useScreenshotStore((s) => s.t);
  const setFilterMode = useScreenshotStore((s) => s.setFilterMode);

  const filterLabels: Record<FilterMode, string> = {
    all: t("filterAll"),
    images: t("filterImages"),
    text: t("filterText"),
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("loading")}
        </p>
      </div>
    );
  }

  const showImages = filterMode === "all" || filterMode === "images";
  const showText = filterMode === "all" || filterMode === "text";
  const hasImages = screenshots.length > 0;
  const hasText = textEntries.length > 0;
  const isEmpty =
    (filterMode === "images" && !hasImages) ||
    (filterMode === "text" && !hasText) ||
    (filterMode === "all" && !hasImages && !hasText);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-3 py-2">
        {filterModes.map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterMode === mode
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            }`}
          >
            {filterLabels[mode]}
          </button>
        ))}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          {filterMode === "text" ? (
            <Type size={40} className="text-[var(--color-text-secondary)]/40" />
          ) : (
            <Camera
              size={40}
              className="text-[var(--color-text-secondary)]/40"
            />
          )}
          <div className="text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {filterMode === "text" ? t("noTextEntries") : t("noScreenshots")}
            </p>
            {filterMode !== "text" && (
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]/60">
                {t("captureHint")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          {/* Images section */}
          {showImages && hasImages && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {screenshots.map((screenshot) => (
                <ThumbnailCard
                  key={screenshot.filename}
                  screenshot={screenshot}
                />
              ))}
            </div>
          )}

          {/* Text section */}
          {showText && hasText && (
            <div
              className={`flex flex-col gap-2 ${showImages && hasImages ? "mt-3" : ""}`}
            >
              {textEntries.map((entry) => (
                <TextCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
