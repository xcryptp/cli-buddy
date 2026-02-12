import { useCallback } from "react";
import { ClipboardCopy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CopyButton } from "../common/CopyButton";
import { useScreenshotStore } from "../../stores/screenshotStore";
import type { TextEntry } from "../../types";

interface TextCardProps {
  entry: TextEntry;
}

export function TextCard({ entry }: TextCardProps) {
  const { deleteTextEntry, pasteFromHistory } = useScreenshotStore();
  const t = useScreenshotStore((s) => s.t);

  const handleCopy = useCallback(
    () => pasteFromHistory(entry.content, "text"),
    [pasteFromHistory, entry.content],
  );

  const handleDelete = useCallback(async () => {
    await deleteTextEntry(entry.id);
  }, [deleteTextEntry, entry.id]);

  const dateStr = (() => {
    try {
      return format(new Date(entry.created_at), "MM/dd HH:mm");
    } catch {
      return entry.created_at;
    }
  })();

  return (
    <div className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 transition-colors hover:border-[var(--color-accent)]/30">
      <pre className="mb-2 line-clamp-3 whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-[var(--color-text-primary)]">
        {entry.preview}
        {entry.char_count > 100 && "..."}
      </pre>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-secondary)]">
          {dateStr} &middot; {entry.char_count.toLocaleString()}
          {t("chars")}
        </span>

        <div className="flex items-center gap-1">
          <CopyButton
            onClick={handleCopy}
            icon={<ClipboardCopy size={13} />}
            label={t("copyText")}
          />
          <button
            onClick={handleDelete}
            title={t("delete")}
            className="flex items-center justify-center rounded-md p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
