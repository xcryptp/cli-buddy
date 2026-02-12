import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  RotateCcw,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  Cpu,
  HardDrive,
} from "lucide-react";
import { useScreenshotStore } from "../../stores/screenshotStore";
import type { VmmemStats, ClaudeSession } from "../../types";

export function DevToolsPanel() {
  const t = useScreenshotStore((s) => s.t);
  const [stats, setStats] = useState<VmmemStats | null>(null);
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [restarting, setRestarting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Vmmem stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await invoke<VmmemStats>("get_vmmem_stats");
      setStats(data);
    } catch (e) {
      console.error("Failed to get vmmem stats:", e);
    }
  }, []);

  // Fetch Claude sessions
  const fetchSessions = useCallback(async () => {
    try {
      const data = await invoke<ClaudeSession[]>("get_claude_sessions");
      setSessions(data);
    } catch (e) {
      console.error("Failed to get claude sessions:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchSessions();
    const interval = setInterval(fetchStats, 5000); // every 5s
    return () => clearInterval(interval);
  }, [fetchStats, fetchSessions]);

  const handleRestart = async () => {
    if (!confirm(t("restartWslConfirm"))) return;
    setRestarting(true);
    try {
      await invoke("restart_wsl");
      fetchStats();
    } catch (e) {
      console.error("WSL restart failed:", e);
    } finally {
      setRestarting(false);
    }
  };

  const handleCopyResume = async (session: ClaudeSession) => {
    await writeText(session.resume_command);
    setCopiedId(session.session_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "danger":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case "danger":
        return "bg-red-500/10 border-red-500/20";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20";
      default:
        return "bg-green-500/10 border-green-500/20";
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* WSL Memory Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-[var(--color-text-secondary)]" />
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
              {t("wslMemory")}
            </h3>
          </div>
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
          >
            <RotateCcw size={11} className={restarting ? "animate-spin" : ""} />
            {restarting ? t("restarting") : t("restartWsl")}
          </button>
        </div>

        {stats && (
          <div
            className={`rounded-lg border p-3 ${statusBg(stats.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={14} className={statusColor(stats.status)} />
                <span className={`text-lg font-bold ${statusColor(stats.status)}`}>
                  {(stats.used_mb / 1024).toFixed(1)} GB
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  / {(stats.limit_mb / 1024).toFixed(0)} GB
                </span>
              </div>
              <span
                className={`text-xs font-semibold ${statusColor(stats.status)}`}
              >
                {stats.usage_percent.toFixed(0)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.status === "danger"
                    ? "bg-red-400"
                    : stats.status === "warning"
                      ? "bg-yellow-400"
                      : "bg-green-400"
                }`}
                style={{ width: `${Math.min(stats.usage_percent, 100)}%` }}
              />
            </div>

            {stats.status !== "normal" && (
              <div className="mt-2 flex items-center gap-1.5">
                <AlertTriangle size={11} className={statusColor(stats.status)} />
                <span className={`text-[10px] ${statusColor(stats.status)}`}>
                  {stats.status === "danger"
                    ? "Memory critical — consider restarting WSL"
                    : "Memory usage is getting high"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Claude Sessions Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[var(--color-text-secondary)]" />
          <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
            {t("claudeSessions")}
          </h3>
          <span className="text-[10px] text-[var(--color-text-secondary)]">
            ({sessions.length})
          </span>
        </div>

        {sessions.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--color-text-secondary)]">
            {t("noSessions")}
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5 transition-colors hover:border-[var(--color-accent)]/30"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">
                        {session.project}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        {session.last_modified}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-[var(--color-text-secondary)]">
                      {session.project_path}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        {session.message_count.toLocaleString()} {t("messages")}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        {session.size_kb > 1024
                          ? `${(session.size_kb / 1024).toFixed(1)} MB`
                          : `${session.size_kb} KB`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyResume(session)}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-[var(--color-bg-tertiary)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
                    title={session.resume_command}
                  >
                    {copiedId === session.session_id ? (
                      <>
                        <Check size={10} />
                        {t("copied")}
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        {t("resume")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
