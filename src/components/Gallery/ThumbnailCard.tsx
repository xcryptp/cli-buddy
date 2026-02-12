import { useCallback } from "react";
import { ClipboardCopy, Image, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CopyButton } from "../common/CopyButton";
import { useScreenshotStore } from "../../stores/screenshotStore";
import type { ScreenshotInfo } from "../../types";

interface ThumbnailCardProps {
  screenshot: ScreenshotInfo;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ThumbnailCard({ screenshot }: ThumbnailCardProps) {
  const { copyPath, copyImage, deleteScreenshot, setSelectedImage } =
    useScreenshotStore();
  const t = useScreenshotStore((s) => s.t);

  const handleCopyPath = useCallback(
    () => copyPath(screenshot.path),
    [copyPath, screenshot.path],
  );

  const handleCopyImage = useCallback(
    () => copyImage(screenshot.filename),
    [copyImage, screenshot.filename],
  );

  const handleDelete = useCallback(async () => {
    await deleteScreenshot(screenshot.filename);
  }, [deleteScreenshot, screenshot.filename]);

  const handlePreview = useCallback(() => {
    setSelectedImage(screenshot);
  }, [setSelectedImage, screenshot]);

  const dateStr = (() => {
    try {
      return format(new Date(screenshot.created_at), "MM/dd HH:mm");
    } catch {
      return screenshot.created_at;
    }
  })();

  return (
    <div className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-colors hover:border-[var(--color-accent)]/30">
      <button
        onClick={handlePreview}
        className="block w-full cursor-pointer border-none bg-transparent p-0"
      >
        <div className="aspect-video w-full overflow-hidden bg-[var(--color-bg-tertiary)]">
          <img
            src={screenshot.thumbnail}
            alt={screenshot.filename}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            draggable={false}
          />
        </div>
      </button>

      <div className="p-2">
        <p
          className="truncate text-xs text-[var(--color-text-secondary)]"
          title={screenshot.filename}
        >
          {dateStr} &middot; {formatFileSize(screenshot.size_bytes)}
        </p>

        <div className="mt-1.5 flex items-center gap-1">
          <CopyButton
            onClick={handleCopyPath}
            icon={<ClipboardCopy size={13} />}
            label={t("copyPath")}
          />
          <CopyButton
            onClick={handleCopyImage}
            icon={<Image size={13} />}
            label={t("copyImage")}
          />
          <button
            onClick={handleDelete}
            title={t("delete")}
            className="ml-auto flex items-center justify-center rounded-md p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
