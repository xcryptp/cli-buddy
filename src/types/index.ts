export interface ScreenshotInfo {
  filename: string;
  path: string;
  thumbnail: string;
  created_at: string;
  size_bytes: number;
}

export interface AppSettings {
  save_directory: string;
  polling_interval_ms: number;
  auto_copy_path: boolean;
  max_screenshots: number;
  auto_start: boolean;
  thumbnail_size: number;
  language: string;
  path_format: string;
}

export type Language = "ko" | "en";

export const translations = {
  ko: {
    appName: "CLI Buddy",
    screenshots: "장의 스크린샷",
    monitoring: "자동 저장 중",
    paused: "꺼짐",
    settings: "설정",
    noScreenshots: "스크린샷이 없습니다",
    captureHint: "Win+Shift+S로 화면을 캡처하세요",
    loading: "불러오는 중...",
    copyPath: "경로 복사",
    copyImage: "이미지 복사",
    delete: "삭제",
    saveDirectory: "저장 경로",
    pollingInterval: "확인 간격 (ms)",
    maxScreenshots: "최대 보관 수",
    autoCopyPath: "캡처 시 자동 경로 복사",
    autoStart: "Windows 시작 시 자동 실행",
    language: "언어",
    pathFormat: "경로 형식",
    pathWindows: "Windows",
    pathWsl: "WSL",
    save: "저장",
    saving: "저장 중...",
    openFolder: "폴더 열기",
  },
  en: {
    appName: "CLI Buddy",
    screenshots: "screenshots",
    monitoring: "Auto Save",
    paused: "Off",
    settings: "Settings",
    noScreenshots: "No screenshots yet",
    captureHint: "Press Win+Shift+S to capture",
    loading: "Loading...",
    copyPath: "Copy path",
    copyImage: "Copy image",
    delete: "Delete",
    saveDirectory: "Save Directory",
    pollingInterval: "Polling Interval (ms)",
    maxScreenshots: "Max Screenshots",
    autoCopyPath: "Auto-copy path on capture",
    autoStart: "Start with Windows",
    language: "Language",
    pathFormat: "Path Format",
    pathWindows: "Windows",
    pathWsl: "WSL",
    save: "Save",
    saving: "Saving...",
    openFolder: "Open Folder",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["ko"];
