<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="128" alt="CLI Buddy icon" />
</p>

<h1 align="center">CLI Buddy</h1>

<p align="center">
  Windows 스크린샷을 자동으로 감지·저장·관리하는 데스크톱 앱
  <br />
  Auto-detect, save, and manage Windows screenshots from your desktop.
</p>

<p align="center">
  <a href="#features--주요-기능">Features</a> •
  <a href="#installation--설치">Install</a> •
  <a href="#usage--사용법">Usage</a> •
  <a href="#development--개발">Dev</a> •
  <a href="#license">License</a>
</p>

---

## Why CLI Buddy? / 왜 CLI Buddy?

**EN** — Windows `Win+Shift+S` copies a screenshot to the clipboard, but it disappears the moment you copy something else. CLI Buddy watches your clipboard in the background, automatically saves every screenshot as a PNG file, and lets you copy the file path (Windows or WSL format) with a single click. Perfect for developers who paste screenshot paths into terminals, markdown, or chat.

**KO** — Windows `Win+Shift+S`로 캡처하면 클립보드에만 남아서 다른 걸 복사하면 사라집니다. CLI Buddy는 백그라운드에서 클립보드를 감시하고, 스크린샷이 감지되면 자동으로 PNG 파일로 저장합니다. 저장된 파일의 경로(Windows/WSL 형식)를 원클릭으로 복사할 수 있어서, 터미널·마크다운·채팅에 경로를 붙여넣는 개발자에게 유용합니다.

---

## Features / 주요 기능

| Feature | Description |
|---------|-------------|
| **Auto Capture** | Detects clipboard images and saves as PNG automatically |
| **Duplicate Detection** | SHA-256 hashing prevents saving the same screenshot twice |
| **Gallery View** | Browse saved screenshots with thumbnails in a responsive grid |
| **Path Copy** | One-click copy in **Windows** (`C:\...`) or **WSL** (`/mnt/c/...`) format |
| **Image Copy** | Copy the screenshot image back to clipboard |
| **System Tray** | Runs in the background; left-click to show, right-click for menu |
| **Auto Cleanup** | Keeps up to N screenshots (configurable), auto-deletes oldest |
| **Settings** | Save directory, polling interval, auto-start, language (한/EN), and more |
| **Bilingual UI** | Full Korean & English interface |

---

## Installation / 설치

### Download / 다운로드

> Releases will be available on the [Releases](../../releases) page.

### Build from Source / 소스에서 빌드

**Prerequisites / 필수 조건:**
- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://rustup.rs/) ≥ 1.77
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

```bash
# Clone
git clone https://github.com/xcryptp/cli-buddy.git
cd cli-buddy

# Install dependencies
npm install

# Run in dev mode
npm run tauri dev

# Build for production
npm run tauri build
```

Build output: `src-tauri/target/release/bundle/` (NSIS installer & MSI)

---

## Usage / 사용법

### Quick Start / 빠른 시작

1. **앱 실행** — CLI Buddy를 실행하면 시스템 트레이에 아이콘이 나타납니다.
2. **스크린샷 캡처** — `Win+Shift+S`로 화면을 캡처합니다.
3. **자동 저장** — 클립보드의 이미지가 자동으로 PNG 파일로 저장됩니다.
4. **경로 복사** — 갤러리에서 📋 버튼을 클릭하면 파일 경로가 복사됩니다.

### Path Formats / 경로 형식

| Format | Example |
|--------|---------|
| Windows | `C:\Users\you\Pictures\CLIBuddy\screenshot_2026-02-12_14-30-45.png` |
| WSL | `/mnt/c/Users/you/Pictures/CLIBuddy/screenshot_2026-02-12_14-30-45.png` |

Settings에서 기본 경로 형식을 Windows 또는 WSL로 변경할 수 있습니다.

### Settings / 설정

| Setting | Default | Description |
|---------|---------|-------------|
| Save Directory | `Pictures/CLIBuddy` | 스크린샷 저장 경로 |
| Polling Interval | `500ms` | 클립보드 확인 간격 (200–5000ms) |
| Max Screenshots | `100` | 최대 보관 수 (초과 시 오래된 것부터 삭제) |
| Auto Copy Path | `ON` | 캡처 시 파일 경로 자동 복사 |
| Auto Start | `OFF` | Windows 시작 시 자동 실행 |
| Language | `한국어` | 한국어 / English |
| Path Format | `Windows` | Windows / WSL |

### System Tray / 시스템 트레이

| Action | Result |
|--------|--------|
| Left-click tray icon | 윈도우 표시/포커스 |
| **Monitor Start/Stop** | 클립보드 감시 시작/중단 |
| **Open Folder** | 스크린샷 저장 폴더 열기 |
| **Show Window** | 앱 창 표시 |
| **Quit** | 앱 종료 |

### File Structure / 파일 구조

```
📁 Pictures/CLIBuddy/
├── screenshot_2026-02-12_14-30-45.png   ← Saved screenshot
├── screenshot_2026-02-12_14-28-10.png
├── latest.png                           ← Always the latest one
└── 📁 .thumbnails/
    ├── screenshot_2026-02-12_14-30-45.png   ← 200×200 thumbnail
    └── screenshot_2026-02-12_14-28-10.png
```

---

## Tech Stack / 기술 스택

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri 2](https://v2.tauri.app/) |
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite 7 |
| State | Zustand 5 |
| Backend | Rust (2021 edition) |
| Clipboard | [arboard](https://crates.io/crates/arboard) |
| Image Processing | [image](https://crates.io/crates/image) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## Development / 개발

```bash
# Dev server with hot reload
npm run tauri dev

# Type check
npx tsc --noEmit

# Build
npm run tauri build
```

### Project Structure

```
cli-buddy/
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # UI components
│   │   ├── Gallery/        # Screenshot gallery (grid, card, preview)
│   │   ├── StatusBar.tsx   # Top bar (monitoring toggle, count, settings)
│   │   ├── SettingsPanel.tsx
│   │   └── common/        # Reusable components
│   ├── hooks/              # React hooks
│   ├── stores/             # Zustand store
│   ├── types/              # TypeScript types + i18n
│   └── styles/             # Global CSS
├── src-tauri/              # Backend (Rust)
│   └── src/
│       ├── commands/       # Tauri IPC commands
│       ├── monitor/        # Clipboard watcher (polling thread)
│       ├── storage/        # File manager + hashing
│       ├── tray/           # System tray setup
│       ├── config.rs       # App settings (JSON)
│       └── state.rs        # Shared app state
├── package.json
├── vite.config.ts
└── src-tauri/tauri.conf.json
```

---

## Contributing / 기여

Contributions are welcome! Feel free to open an issue or submit a pull request.

기여를 환영합니다! 이슈를 열거나 PR을 보내주세요.

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built with Tauri + React + Rust
</p>
