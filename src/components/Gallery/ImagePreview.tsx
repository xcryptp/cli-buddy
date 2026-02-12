import { useCallback, useEffect, useState } from "react";
import { X, ClipboardCopy, Image, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { useScreenshotStore } from "../../stores/screenshotStore";
import { CopyButton } from "../common/CopyButton";
import { convertFileSrc } from "@tauri-apps/api/core";

export function ImagePreview() {
  const { selectedImage, setSelectedImage, copyPath, copyImage, deleteScreenshot } =
    useScreenshotStore();
  const [fullSize, setFullSize] = useState(false);

  const handleClose = useCallback(() => {
    setSelectedImage(null);
    setFullSize(false);
  }, [setSelectedImage]);

  const handleDelete = useCallback(async () => {
    if (!selectedImage) return;
    await deleteScreenshot(selectedImage.filename);
    setSelectedImage(null);
  }, [selectedImage, deleteScreenshot, setSelectedImage]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullSize) {
          setFullSize(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose, fullSize]);

  // Reset fullSize when image changes
  useEffect(() => {
    setFullSize(false);
  }, [selectedImage]);

  if (!selectedImage) return null;

  const imageSrc = fullSize
    ? convertFileSrc(selectedImage.path)
    : selectedImage.thumbnail;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={fullSize ? () => setFullSize(false) : handleClose}
    >
      <div
        className={`relative ${fullSize ? "max-h-[98vh] max-w-[98vw] overflow-auto" : "max-h-[90vh] max-w-[90vw]"}`}
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
          src={imageSrc}
          alt={selectedImage.filename}
          className={`rounded-lg ${
            fullSize
              ? "max-h-none max-w-none cursor-zoom-out"
              : "max-h-[80vh] max-w-[85vw] cursor-zoom-in object-contain"
          }`}
          draggable={false}
          onClick={() => setFullSize(!fullSize)}
        />

        {/* Bottom bar */}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2">
          <p className="truncate text-xs text-[var(--color-text-secondary)]">
            {selectedImage.path}
          </p>
          <div className="flex items-center gap-1.5 pl-3">
            <button
              onClick={() => setFullSize(!fullSize)}
              title={fullSize ? "Fit to screen" : "Original size"}
              className="flex items-center justify-center rounded-md p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
            >
              {fullSize ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
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
