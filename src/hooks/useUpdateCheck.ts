import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-shell";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes: string;
}

function compareVersions(current: string, latest: string): boolean {
  const c = current.replace(/^v/, "").split(".").map(Number);
  const l = latest.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

export function useUpdateCheck() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const currentVersion = await getVersion();
        const res = await fetch(
          "https://api.github.com/repos/xcryptp/cli-buddy/releases/latest"
        );
        if (!res.ok) return;

        const data = await res.json();
        const latestVersion = data.tag_name as string;

        if (compareVersions(currentVersion, latestVersion)) {
          setUpdate({
            currentVersion,
            latestVersion,
            releaseUrl: data.html_url,
            releaseNotes: data.body || "",
          });
        }
      } catch {
        // Silently fail - no internet or API limit
      }
    };

    check();
    // Check every 30 minutes
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openRelease = () => {
    if (update) {
      open(update.releaseUrl);
    }
  };

  const dismiss = () => setDismissed(true);

  return { update: dismissed ? null : update, openRelease, dismiss };
}
