import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useScreenshotStore } from "../stores/screenshotStore";
import type { ScreenshotInfo, TextEntry } from "../types";

export function useScreenshots() {
  const {
    fetchScreenshots,
    addScreenshot,
    fetchMonitorStatus,
    fetchSettings,
    fetchTextHistory,
    addTextEntry,
  } = useScreenshotStore();

  useEffect(() => {
    fetchScreenshots();
    fetchTextHistory();
    fetchMonitorStatus();
    fetchSettings();

    const unlistenScreenshot = listen<ScreenshotInfo>(
      "new-screenshot",
      (event) => {
        addScreenshot(event.payload);
      },
    );

    const unlistenText = listen<TextEntry>("new-text-entry", (event) => {
      addTextEntry(event.payload);
    });

    return () => {
      unlistenScreenshot.then((fn) => fn());
      unlistenText.then((fn) => fn());
    };
  }, [
    fetchScreenshots,
    addScreenshot,
    fetchMonitorStatus,
    fetchSettings,
    fetchTextHistory,
    addTextEntry,
  ]);
}
