import { useCallback, useEffect, useState } from "react";
import { X, ClipboardCopy, Image, Trash2, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useScreenshotStore } from "../../stores/screenshotStore";
import { CopyButton } from "../common/CopyButton";

export function ImagePreview() {
  const { selectedImage, setSelectedImage, copyPath, copyImage, deleteScreenshot } =
    useScreenshotStore();
  const [fullSize, setFullSize] = useState(false);
  const [fullImageSrc, setFullImageSrc] = useState<string | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClose = useCallback(() => {
    setSelectedImage(null);
    setFullSize(false);
    setFullImageSrc(null);
    setImageError(false);
  }, [setSelectedImage]);

  const handleDelete = useCallback(async () => {
    if (!selectedImage) return;
    await deleteScreenshot(selectedImage.filename);
    setSelectedImage(null);
  }, [selectedImage, deleteScreenshot, setSelectedImage]);

  // Load full image from backend
  const loadFullImage = useCallback(async (path: string) => {
    setLoadingFull(true);
    setImageError(false);
    try {
      const dataUrl = await invoke<string>("get_image_base64", { path });
      setFullImageSrc(dataUrl);
    } catch (e) {
      console.error("Failed to load full image:", e);
      setImageError(true);
    } finally {
      setLoadingFull(false);
    }
  }, []);

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

  // Load full image when preview opens
  useEffect(() => {
    setFullSize(false);
    setFullImageSrc(null);
    setImageError(false);
    if (selectedImage) {
      loadFullImage(selectedImage.path);
    }
  }, [selectedImage, loadFullImage]);

  if (!selectedImage) return null;

  const imageSrc = fullImageSrc || selectedImage.thumbnail;

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
        <div className="relative">
          {imageError ? (
            <div className="flex h-40 w-80 items-center justify-center rounded-lg bg-[var(--color-bg-secondary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Failed to load image
              </p>
            </div>
          ) : (
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
          )}
          {/* Loading overlay */}
          {loadingFull && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
              <Loader2 size={24} className="animate-spin text-white" />
            </div>
          )}
        </div>

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
