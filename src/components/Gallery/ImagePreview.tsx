import { useCallback, useEffect } from "react";
import { X, ClipboardCopy, Image, Trash2 } from "lucide-react";
import { useScreenshotStore } from "../../stores/screenshotStore";
import { CopyButton } from "../common/CopyButton";

export function ImagePreview() {
  const { selectedImage, setSelectedImage, copyPath, copyImage, deleteScreenshot } =
    useScreenshotStore();

  const handleClose = useCallback(() => {
    setSelectedImage(null);
  }, [setSelectedImage]);

  const handleDelete = useCallback(async () => {
    if (!selectedImage) return;
    await deleteScreenshot(selectedImage.filename);
    setSelectedImage(null);
  }, [selectedImage, deleteScreenshot, setSelectedImage]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -right-2 -top-2 z-10 rounded-full bg-[var(--color-bg-tertiary)] p-1.5 text-[var(--color-text-secondary)] shadow-lg transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
        >
          <X size={16} />
        </button>

        {/* Image */}
        <img
          src={selectedImage.thumbnail.replace(
            "data:image/png;base64,",
            `data:image/png;base64,`,
          )}
          alt={selectedImage.filename}
          className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain"
          draggable={false}
        />

        {/* Bottom bar */}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2">
          <p className="truncate text-xs text-[var(--color-text-secondary)]">
            {selectedImage.path}
          </p>
          <div className="flex items-center gap-1.5 pl-3">
            <CopyButton
              onClick={() => copyPath(selectedImage.path)}
              icon={<ClipboardCopy size={14} />}
              label="Copy path"
            />
            <CopyButton
              onClick={() => copyImage(selectedImage.filename)}
              icon={<Image size={14} />}
              label="Copy image"
            />
            <button
              onClick={handleDelete}
              title="Delete"
              className="flex items-center justify-center rounded-md p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
