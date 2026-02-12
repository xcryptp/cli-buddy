import { useState, useCallback } from "react";
import { Check } from "lucide-react";

interface CopyButtonProps {
  onClick: () => Promise<void>;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export function CopyButton({ onClick, icon, label, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      await onClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      title={label}
      className={`flex items-center justify-center rounded-md p-1.5 transition-colors
        ${copied
          ? "bg-green-500/20 text-green-400"
          : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
        } ${className}`}
    >
      {copied ? <Check size={14} /> : icon}
    </button>
  );
}
