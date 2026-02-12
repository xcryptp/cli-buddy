import { useScreenshotStore } from "../stores/screenshotStore";

export function useMonitorStatus() {
  const isMonitoring = useScreenshotStore((s) => s.isMonitoring);
  const toggleMonitor = useScreenshotStore((s) => s.toggleMonitor);

  return { isMonitoring, toggleMonitor };
}
