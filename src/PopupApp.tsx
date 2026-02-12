import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { format } from "date-fns";
import { Image, Type, X } from "lucide-react";
import type { ClipboardEntry } from "./types";

export function PopupApp() {
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<ClipboardEntry[]>("get_clipboard_history")
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Close on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        getCurrentWindow().close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Close on blur (focus lost)
    const handleBlur = () => {
      setTimeout(() => {
        getCurrentWindow().close();
      }, 150);
    };
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const handleClick = async (entry: ClipboardEntry) => {
    try {
      if (entry.type === "text") {
        await invoke("paste_from_history", {
          content: entry.data.content,
          entryType: "text",
        });
      } else {
        await invoke("paste_from_history", {
          content: entry.data.path,
          entryType: "image",
        });
      }
      getCurrentWindow().close();
    } catch (e) {
      console.error("Paste failed:", e);
    }
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MM/dd HH:mm");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Draggable header */}
      <div
        className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2"
        data-tauri-drag-region
      >
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
          Clipboard History
        </span>
        <button
          onClick={handleClose}
          className="rounded-md p-0.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-[var(--color-text-secondary)]">...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-[var(--color-text-secondary)]">
              No items
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const key =
              entry.type === "image" ? entry.data.filename : entry.data.id;
            const createdAt =
              entry.type === "image"
                ? entry.data.created_at
                : entry.data.created_at;

            return (
              <button
                key={key}
                onClick={() => handleClick(entry)}
                className="flex w-full items-center gap-2 border-b border-[var(--color-border)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-hover)]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[var(--color-bg-tertiary)]">
                  {entry.type === "image" ? (
                    <Image size={14} className="text-[var(--color-accent)]" />
                  ) : (
                    <Type size={14} className="text-[var(--color-success)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-[var(--color-text-primary)]">
                    {entry.type === "image"
                      ? entry.data.filename
                      : entry.data.preview}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">
                    {formatDate(createdAt)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
