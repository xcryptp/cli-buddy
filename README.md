<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="128" alt="CLI Buddy icon" />
</p>

<h1 align="center">CLI Buddy</h1>

<p align="center">
  <strong>Clipboard manager + WSL2 monitor + Claude Code session manager for Windows developers</strong>
  <br />
  <em>Windows 개발자를 위한 클립보드 매니저 + WSL2 모니터 + Claude Code 세션 관리 도구</em>
</p>

<p align="center">
  <a href="https://github.com/xcryptp/cli-buddy/releases/latest">
    <img src="https://img.shields.io/github/v/release/xcryptp/cli-buddy?style=flat-square&v=4" alt="Latest Release" />
  </a>
  <a href="https://github.com/xcryptp/cli-buddy/releases/latest">
    <img src="https://img.shields.io/github/downloads/xcryptp/cli-buddy/total?style=flat-square&v=4" alt="Downloads" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/xcryptp/cli-buddy?style=flat-square&v=4" alt="License" />
  </a>
</p>

<p align="center">
  <a href="#download">Download</a> •
  <a href="#features">Features</a> •
  <a href="#wsl2-devtools">WSL2 DevTools</a> •
  <a href="#usage">Usage</a> •
  <a href="#changelog">Changelog</a> •
  <a href="#build-from-source">Build</a>
</p>

---

## The Problem / 이런 문제를 해결합니다

**EN** — If you use WSL2 on Windows, you know the pain:
- `Win+Shift+S` screenshots disappear when you copy something else
- WSL2 silently eats all your RAM until your terminal crashes
- Claude Code sessions are lost when WSL goes down, and finding the resume command is a hassle

**KO** — Windows에서 WSL2를 쓰는 개발자라면 이런 불편함을 겪어봤을 겁니다:
- `Win+Shift+S`로 캡처한 스크린샷이 다른 걸 복사하면 사라짐
- WSL2가 조용히 RAM을 다 잡아먹다가 터미널이 갑자기 꺼짐
- WSL이 죽으면 Claude Code 세션도 날아가고, resume 명령어 찾기가 귀찮음

**CLI Buddy fixes all of this in one lightweight desktop app.**

---

## Download

**[Latest Release](https://github.com/xcryptp/cli-buddy/releases/latest)**

| File | Description |
|------|-------------|
| **`CLI.Buddy.exe`** | Portable — download and run directly / 포터블 — 다운받아서 바로 실행 |
| `CLI.Buddy_x64-setup.exe` | Installer — auto-start, start menu / 설치형 — 자동시작, 시작메뉴 등록 |

> Requires Windows 10/11 with WebView2 (pre-installed on modern Windows).
> Auto-update check: the app notifies you when a new version is available.

---

## Features

### Clipboard Manager / 클립보드 매니저

| Feature | Description |
|---------|-------------|
| **Auto-save screenshots** | Detects clipboard images → saves as PNG automatically / 클립보드 이미지 감지 → PNG 자동 저장 |
| **Text clipboard history** | Tracks every text you copy (up to 10KB/entry) / 복사한 텍스트 자동 기록 |
| **Deduplicate** | SHA-256 hash prevents saving identical screenshots / SHA-256으로 동일 스크린샷 중복 방지 |
| **Gallery view** | Thumbnail grid with hover overlay + full-size preview / 썸네일 그리드 (호버 오버레이) + 원본 크기 확대 |
| **Split layout** | All mode shows images left, text right / All 모드에서 이미지·텍스트 좌우 분할 |
| **One-click copy** | Copy file path in Windows (`C:\...`) or WSL (`/mnt/c/...`) format / 경로 원클릭 복사 |
| **Expand text** | Click to expand/collapse long text entries with labels / 긴 텍스트 펼치기·접기 |
| **Filter** | All / Images / Text / DevTools tabs / 전체 / 이미지 / 텍스트 / DevTools 필터 |

### WSL2 DevTools / WSL2 개발자 도구

> **Actively in development** — This feature is under continuous development, testing, and improvement.
> **지속적으로 개발, 테스트, 개선 중인 기능입니다.**

| Feature | Description |
|---------|-------------|
| **Real-time Vmmem monitoring** | Shows WSL2 memory usage in status bar (color-coded) / 상태바에 WSL2 메모리 실시간 표시 |
| **Memory warning** | Green → Yellow (75%) → Red (90%) with progress bar / 단계별 경고 표시 |
| **Claude Code sessions** | Lists sessions with project, topic, time, message count / 세션 목록 (프로젝트, 토픽, 시간, 메시지 수) |
| **Session topic** | Shows first user message as topic for quick identification / 첫 메시지를 토픽으로 표시 |
| **One-click resume** | Copy `claude --resume <id>` to clipboard / 이어하기 명령어 원클릭 복사 |
| **WSL restart** | Restart WSL from tray menu or DevTools panel / 트레이 메뉴 또는 UI에서 WSL 재시작 |

### General / 일반

| Feature | Description |
|---------|-------------|
| **System tray** | Runs in background, left-click to show, right-click for menu / 백그라운드 실행 |
| **Global shortcut** | `Alt+Shift+V` to show app from anywhere (customizable, live re-registration) / 글로벌 단축키 (변경 즉시 반영) |
| **Popup keyboard nav** | Arrow keys + Enter to navigate and select clipboard entries / 팝업에서 키보드 탐색 |
| **Popup near cursor** | DPI-aware positioning near mouse cursor / DPI 인식 마우스 커서 근처 팝업 |
| **Auto-update check** | Checks GitHub releases on startup, shows banner / 시작 시 업데이트 확인 |
| **i18n** | Korean / English / 한국어·영어 지원 |
| **Auto-start** | Optional launch on Windows boot / Windows 부팅 시 자동 실행 |

---

## WSL2 DevTools

The killer feature for WSL2 users. CLI Buddy monitors the `Vmmem` process (WSL2's Hyper-V VM) and gives you real-time visibility into memory usage — something Windows doesn't provide natively.

WSL2 사용자를 위한 핵심 기능. Windows가 기본 제공하지 않는 Vmmem 프로세스(WSL2 VM) 메모리를 실시간으로 보여줍니다.

### Why this matters / 왜 필요한가

WSL2 runs as a Hyper-V VM that **never returns memory to Windows** by default. When Node.js, Rust builds, or Docker consume memory inside WSL, the VM keeps growing until:

1. Windows runs out of RAM → your terminal (Warp, Windows Terminal, etc.) crashes
2. WSL2 kernel panics → `wsl --shutdown` is the only fix
3. All running Claude Code sessions are lost

CLI Buddy **warns you before it happens** and provides one-click WSL restart.

WSL2는 기본적으로 **한번 잡은 메모리를 반환하지 않는** Hyper-V VM입니다. 메모리가 가득 차면 터미널이 크래시되고, WSL이 먹통이 되며, Claude Code 세션이 날아갑니다. CLI Buddy는 **터지기 전에 경고**해주고 원클릭 재시작을 제공합니다.

### Claude Code Session Recovery / Claude 세션 복구

When WSL crashes, your Claude Code sessions aren't actually lost — they're saved in `~/.claude/projects/`. CLI Buddy reads these session files and shows them in a clean list with one-click resume.

WSL이 크래시되어도 Claude Code 세션은 `~/.claude/projects/`에 저장되어 있습니다. CLI Buddy가 세션 파일을 읽어서 목록으로 보여주고, 원클릭으로 이어하기 명령어를 복사해줍니다.

```bash
# What you'd normally have to do manually:
# 보통은 이렇게 수동으로 해야 하지만:
claude --resume 680a1b99-ec61-44ca-8019-775f099d5165

# CLI Buddy: just click "Resume" → command copied to clipboard
# CLI Buddy에서는: "이어하기" 클릭 → 명령어가 클립보드에 복사
```

---

## Usage

### Quick Start / 빠른 시작

1. **Download & Run** — Download `CLI.Buddy.exe` → double-click to run
2. **Capture** — `Win+Shift+S` to screenshot → automatically saved
3. **Copy text** — Copy any text → automatically recorded
4. **Browse** — Open gallery to view, copy paths, or manage history
5. **Quick access** — `Alt+Shift+V` to show app from anywhere
6. **Monitor WSL** — Check DevTools tab for memory status + Claude sessions

### System Tray / 시스템 트레이

| Menu | Action |
|------|--------|
| **Monitor Start/Stop** | Toggle clipboard monitoring / 클립보드 감시 시작/중단 |
| **Open Folder** | Open screenshot save directory / 저장 폴더 열기 |
| **Restart WSL** | Shutdown and restart WSL / WSL 재시작 |
| **Show Window** | Show main window / 앱 창 표시 |
| **Quit** | Exit application / 앱 종료 |

### Settings / 설정

| Setting | Default | Description |
|---------|---------|-------------|
| Save Directory | `Pictures/CLIBuddy` | Screenshot save path / 저장 경로 |
| Polling Interval | `500ms` | Clipboard check interval / 확인 간격 |
| Max Screenshots | `100` | Max stored screenshots / 최대 보관 수 |
| Max Text Entries | `50` | Max text history entries / 최대 텍스트 수 |
| Global Shortcut | `Alt+Shift+V` | Key combo recorder / 키 조합 녹화 방식 |
| Auto Copy Path | `ON` | Auto-copy path on capture / 자동 경로 복사 |
| Capture Text | `ON` | Save text clipboard / 텍스트 자동 저장 |
| Auto Start | `OFF` | Launch on Windows boot / 자동 시작 |
| Language | `한국어` | Korean / English |
| Path Format | `Windows` | Windows / WSL path format |

---

## Changelog

### v0.2.0

**Popup UX, Image Preview Overhaul & Session Topic Display**

- **NEW**: Popup keyboard navigation (Arrow keys + Enter) with selection highlight
- **NEW**: Image preview loads via backend IPC instead of file protocol (security fix)
- **NEW**: Claude session topic display (first user message)
- **NEW**: Gallery split layout — images left, text right in All mode
- **NEW**: Thumbnail hover overlay with zoom icon
- **FIX**: DPI-aware popup positioning (high-DPI monitor support)
- **FIX**: Popup no longer closes when dragging the window
- **FIX**: `vmmem*` wildcard detects both vmmem and vmmemWSL
- **FIX**: Console window no longer flashes when running PowerShell/WSL commands
- **IMPROVE**: Dynamic global shortcut re-registration on settings change
- **IMPROVE**: Claude session search — both Windows native + WSL paths via `wslpath`
- **IMPROVE**: DevTools skeleton loading UI for stats and sessions
- **IMPROVE**: Text card expand/collapse with labels

### v0.1.1

**DevTools, WSL Monitoring & UX Improvements**

- **NEW**: WSL2 Vmmem memory monitoring (status bar + DevTools panel)
- **NEW**: Claude Code session list with one-click resume
- **NEW**: WSL restart from tray menu and DevTools
- **NEW**: Auto-update check with banner notification
- **FIX**: Duplicate tray icon bug
- **FIX**: Small taskbar icon (ICO now includes 7 sizes)
- **FIX**: Popup opens near mouse cursor instead of screen center
- **IMPROVE**: Global shortcut key recorder (press combo to set)
- **IMPROVE**: Status bar shows screenshot + text + WSL memory
- **IMPROVE**: Click to expand long text entries
- **IMPROVE**: Click image to toggle original size

### v0.1.0

**Initial Release**

- Clipboard image auto-detect and save (SHA-256 dedup)
- Text clipboard history
- Gallery view with filters
- Windows/WSL path copy
- System tray + global shortcut (`Alt+Shift+V`)
- Bilingual UI (Korean/English)
- Custom app icon
- GitHub Actions release pipeline

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri 2](https://v2.tauri.app/) |
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite 7 |
| State | Zustand 5 |
| Backend | Rust 2021 |
| Clipboard | [arboard](https://crates.io/crates/arboard) |
| Image | [image](https://crates.io/crates/image) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## Build from Source

**Prerequisites:**
- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://rustup.rs/) ≥ 1.77
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload)

```bash
git clone https://github.com/xcryptp/cli-buddy.git
cd cli-buddy
npm install
npm run tauri dev       # Development (hot reload)
npm run tauri build     # Production build
```

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

기여를 환영합니다! 이슈를 열거나 PR을 보내주세요.

---

## License

[MIT](LICENSE)

---

<p align="center">
  Made by <a href="https://github.com/xcryptp">xcryptp</a> · Built with Tauri + React + Rust
  <br />
  <a href="https://myportfolio.xcryptp.workers.dev/">Portfolio</a>
  <br />
  <sub>프로덕트 깎는 4람</sub>
</p>
