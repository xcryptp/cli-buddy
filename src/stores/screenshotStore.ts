import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, Language, ScreenshotInfo } from "../types";
import { translations } from "../types";

interface ScreenshotStore {
  screenshots: ScreenshotInfo[];
  isMonitoring: boolean;
  isLoading: boolean;
  selectedImage: ScreenshotInfo | null;
  language: Language;

  fetchScreenshots: () => Promise<void>;
  addScreenshot: (info: ScreenshotInfo) => void;
  removeScreenshot: (filename: string) => void;
  setMonitoring: (status: boolean) => void;
  setSelectedImage: (info: ScreenshotInfo | null) => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof (typeof translations)["ko"]) => string;

  copyPath: (path: string) => Promise<void>;
  copyImage: (filename: string) => Promise<void>;
  deleteScreenshot: (filename: string) => Promise<void>;
  toggleMonitor: () => Promise<void>;
  fetchMonitorStatus: () => Promise<void>;
  fetchSettings: () => Promise<void>;
}

export const useScreenshotStore = create<ScreenshotStore>((set, get) => ({
  screenshots: [],
  isMonitoring: false,
  isLoading: false,
  selectedImage: null,
  language: "ko",

  fetchScreenshots: async () => {
    set({ isLoading: true });
    try {
      const screenshots = await invoke<ScreenshotInfo[]>("get_screenshots");
      set({ screenshots });
    } catch (e) {
      console.error("Failed to fetch screenshots:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  addScreenshot: (info) => {
    set((state) => ({
      screenshots: [info, ...state.screenshots],
    }));
  },

  removeScreenshot: (filename) => {
    set((state) => ({
      screenshots: state.screenshots.filter((s) => s.filename !== filename),
    }));
  },

  setMonitoring: (status) => set({ isMonitoring: status }),
  setSelectedImage: (info) => set({ selectedImage: info }),

  setLanguage: (lang) => set({ language: lang }),

  t: (key) => {
    const lang = get().language;
    return translations[lang][key];
  },

  copyPath: async (path) => {
    await invoke("copy_path", { path });
  },

  copyImage: async (filename) => {
    await invoke("copy_image", { filename });
  },

  deleteScreenshot: async (filename) => {
    await invoke("delete_screenshot", { filename });
    get().removeScreenshot(filename);
  },

  toggleMonitor: async () => {
    const isRunning = await invoke<boolean>("toggle_monitor");
    set({ isMonitoring: isRunning });
  },

  fetchMonitorStatus: async () => {
    const status = await invoke<boolean>("get_monitor_status");
    set({ isMonitoring: status });
  },

  fetchSettings: async () => {
    try {
      const settings = await invoke<AppSettings>("get_settings");
      set({ language: settings.language as Language });
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  },
}));
