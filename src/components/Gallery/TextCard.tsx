import { useCallback, useState } from "react";
import { ClipboardCopy, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);

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

  const isLong = entry.char_count > 100;

  return (
    <div className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 transition-colors hover:border-[var(--color-accent)]/30">
      <div
        className={isLong ? "cursor-pointer rounded-md transition-colors hover:bg-[var(--color-bg-tertiary)]" : ""}
        onClick={() => isLong && setExpanded(!expanded)}
      >
        <pre
          className={`mb-2 whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-[var(--color-text-primary)] ${
            expanded ? "max-h-[60vh] overflow-y-auto" : "line-clamp-3"
          }`}
        >
          {expanded ? entry.content : entry.preview}
          {!expanded && isLong && "..."}
        </pre>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-text-secondary)]">
            {dateStr} &middot; {entry.char_count.toLocaleString()}
            {t("chars")}
          </span>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
            >
              {expanded ? (
                <>
                  <ChevronUp size={10} />
                  {t("collapseText")}
                </>
              ) : (
                <>
                  <ChevronDown size={10} />
                  {t("expandText")}
                </>
              )}
            </button>
          )}
        </div>

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
