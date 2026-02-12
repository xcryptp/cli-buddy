export interface ScreenshotInfo {
  filename: string;
  path: string;
  thumbnail: string;
  created_at: string;
  size_bytes: number;
}

export interface TextEntry {
  id: string;
  content: string;
  preview: string;
  hash: string;
  created_at: string;
  char_count: number;
}

export type ClipboardEntry =
  | { type: "image"; data: ScreenshotInfo }
  | { type: "text"; data: TextEntry };

export type FilterMode = "all" | "images" | "text" | "devtools";

export interface VmmemStats {
  used_mb: number;
  limit_mb: number;
  usage_percent: number;
  status: "normal" | "warning" | "danger";
}

export interface ClaudeSession {
  session_id: string;
  project: string;
  project_path: string;
  last_modified: string;
  message_count: number;
  size_kb: number;
  resume_command: string;
  topic: string;
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
  capture_text: boolean;
  max_text_entries: number;
  global_shortcut: string;
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
    // Text clipboard
    captureText: "텍스트 클립보드 저장",
    maxTextEntries: "최대 텍스트 보관 수",
    globalShortcut: "글로벌 단축키",
    filterAll: "전체",
    filterImages: "이미지",
    filterText: "텍스트",
    noTextEntries: "텍스트 기록이 없습니다",
    copyText: "텍스트 복사",
    clearHistory: "기록 삭제",
    chars: "자",
    textEntries: "개의 텍스트",
    noItems: "항목이 없습니다",
    devtools: "DevTools",
    wslMemory: "WSL 메모리",
    restartWsl: "WSL 재시작",
    restartWslConfirm: "WSL을 재시작하면 실행 중인 모든 WSL 프로세스가 종료됩니다. 계속하시겠습니까?",
    restarting: "재시작 중...",
    restarted: "WSL 재시작 완료",
    claudeSessions: "Claude 세션",
    noSessions: "세션이 없습니다",
    resume: "이어하기",
    copied: "복사됨",
    messages: "메시지",
    skipPermissions: "권한 스킵",
    wslNotDetected: "WSL이 감지되지 않음",
    wslNotRunning: "WSL이 실행 중이 아닙니다",
    refreshSessions: "새로고침",
    viewOriginal: "원본 보기",
    expandText: "펼치기",
    collapseText: "접기",
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
    // Text clipboard
    captureText: "Save text clipboard",
    maxTextEntries: "Max text entries",
    globalShortcut: "Global shortcut",
    filterAll: "All",
    filterImages: "Images",
    filterText: "Text",
    noTextEntries: "No text entries yet",
    copyText: "Copy text",
    clearHistory: "Clear history",
    chars: "chars",
    textEntries: "texts",
    noItems: "No items",
    devtools: "DevTools",
    wslMemory: "WSL Memory",
    restartWsl: "Restart WSL",
    restartWslConfirm: "Restarting WSL will terminate all running WSL processes. Continue?",
    restarting: "Restarting...",
    restarted: "WSL restarted",
    claudeSessions: "Claude Sessions",
    noSessions: "No sessions found",
    resume: "Resume",
    copied: "Copied",
    messages: "messages",
    skipPermissions: "Skip Permissions",
    wslNotDetected: "WSL not detected",
    wslNotRunning: "WSL is not running",
    refreshSessions: "Refresh",
    viewOriginal: "View Original",
    expandText: "Expand",
    collapseText: "Collapse",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["ko"];
