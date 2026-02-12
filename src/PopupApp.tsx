import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { format } from "date-fns";
import { Image, Type, X } from "lucide-react";
import type { ClipboardEntry } from "./types";

export function PopupApp() {
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    invoke<ClipboardEntry[]>("get_clipboard_history")
      .then((data) => {
        setEntries(data);
        setSelectedIndex(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Escape to close
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") getCurrentWindow().close();
    };
    window.addEventListener("keydown", handleEsc);

    // Close on blur — skip if dragging
    let blurTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleBlur = () => {
      if (isDragging.current) return;
      blurTimeout = setTimeout(() => {
        getCurrentWindow().close();
      }, 300);
    };
    const handleFocus = () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    };
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleEsc);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, []);

  // Separate effect for keyboard with access to entries
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (entries.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(entries.length - 1, prev + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const entry = entries[selectedIndex];
        if (entry) handleClick(entry);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entries, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-entry-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

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
        className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2.5"
        data-tauri-drag-region
        onMouseDown={() => { isDragging.current = true; }}
        onMouseUp={() => { isDragging.current = false; }}
      >
        <span
          className="pointer-events-none select-none text-xs font-semibold text-[var(--color-text-primary)]"
          data-tauri-drag-region
        >
          Clipboard History
        </span>
        <button
          onClick={handleClose}
          className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" ref={listRef}>
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
          entries.map((entry, index) => {
            const key =
              entry.type === "image" ? entry.data.filename : entry.data.id;
            const createdAt =
              entry.type === "image"
                ? entry.data.created_at
                : entry.data.created_at;
            const isSelected = index === selectedIndex;

            return (
              <button
                key={key}
                data-entry-index={index}
                onClick={() => handleClick(entry)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-2 border-b border-[var(--color-border)] px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? "bg-[var(--color-accent)]/15"
                    : "hover:bg-[var(--color-bg-hover)]"
                }`}
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
