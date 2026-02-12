import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useScreenshotStore } from "../stores/screenshotStore";
import type { ScreenshotInfo } from "../types";

export function useScreenshots() {
  const { fetchScreenshots, addScreenshot, fetchMonitorStatus, fetchSettings } =
    useScreenshotStore();

  useEffect(() => {
    fetchScreenshots();
    fetchMonitorStatus();
    fetchSettings();

    const unlisten = listen<ScreenshotInfo>("new-screenshot", (event) => {
      addScreenshot(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [fetchScreenshots, addScreenshot, fetchMonitorStatus, fetchSettings]);
}
