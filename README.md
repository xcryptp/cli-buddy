<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="128" alt="CLI Buddy icon" />
</p>

<h1 align="center">CLI Buddy</h1>

<p align="center">
  Windows 클립보드를 자동으로 감지·저장·관리하는 데스크톱 앱
  <br />
  Auto-detect, save, and manage your clipboard (images & text) from your desktop.
</p>

<p align="center">
  <a href="https://github.com/xcryptp/cli-buddy/releases/latest">
    <img src="https://img.shields.io/github/v/release/xcryptp/cli-buddy?style=flat-square&v=2" alt="Latest Release" />
  </a>
  <a href="https://github.com/xcryptp/cli-buddy/releases/latest">
    <img src="https://img.shields.io/github/downloads/xcryptp/cli-buddy/total?style=flat-square&v=2" alt="Downloads" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/xcryptp/cli-buddy?style=flat-square&v=2" alt="License" />
  </a>
</p>

<p align="center">
  <a href="#download--다운로드">Download</a> •
  <a href="#features--주요-기능">Features</a> •
  <a href="#usage--사용법">Usage</a> •
  <a href="#settings--설정">Settings</a> •
  <a href="#build-from-source--소스에서-빌드">Build</a> •
  <a href="#license">License</a>
</p>

---

## Download / 다운로드

**[Latest Release](https://github.com/xcryptp/cli-buddy/releases/latest)** 에서 Windows 설치 파일을 다운로드하세요.

| File | Description |
|------|-------------|
| `CLI.Buddy_x.x.x_x64-setup.exe` | Windows 설치 프로그램 (NSIS) |
| `CLI.Buddy_x.x.x_x64_en-US.msi` | Windows 설치 프로그램 (MSI) |

> 설치 후 시스템 트레이에서 실행됩니다.

---

## Why CLI Buddy? / 왜 CLI Buddy?

**EN** — Windows `Win+Shift+S` copies a screenshot to the clipboard, but it disappears the moment you copy something else. CLI Buddy watches your clipboard in the background, automatically saves every screenshot as a PNG file, and lets you copy the file path (Windows or WSL format) with a single click. It also tracks your text clipboard history so you never lose copied text again.

**KO** — `Win+Shift+S`로 캡처하면 클립보드에만 남아서 다른 걸 복사하면 사라집니다. CLI Buddy는 백그라운드에서 클립보드를 감시하고, 스크린샷은 자동으로 PNG 파일로 저장하며, 텍스트 복사 기록도 함께 관리합니다. 저장된 파일의 경로(Windows/WSL 형식)를 원클릭으로 복사할 수 있어서, 터미널·마크다운·채팅에 경로를 붙여넣는 개발자에게 유용합니다.

---

## Features / 주요 기능

### Screenshot / 스크린샷
- **자동 캡처** — 클립보드 이미지를 감지해 PNG로 자동 저장
- **중복 제거** — SHA-256 해싱으로 동일 스크린샷 중복 저장 방지
- **갤러리 뷰** — 썸네일 그리드 + 풀사이즈 미리보기
- **경로 복사** — Windows (`C:\...`) 또는 WSL (`/mnt/c/...`) 형식 원클릭 복사
- **이미지 복사** — 스크린샷을 클립보드로 다시 복사
- **자동 정리** — 최대 보관 수 초과 시 오래된 것부터 자동 삭제

### Text Clipboard / 텍스트 클립보드
- **텍스트 기록** — 복사한 텍스트를 자동으로 기록 (최대 10KB/항목)
- **히스토리 관리** — 텍스트 기록 검색, 재복사, 개별/전체 삭제
- **필터** — 전체 / 이미지 / 텍스트 필터링

### General / 일반
- **시스템 트레이** — 백그라운드 실행, 좌클릭으로 표시, 우클릭 메뉴
- **글로벌 단축키** — `Alt+Shift+V`로 어디서든 앱 표시 (설정 변경 가능)
- **다국어 UI** — 한국어 / English 지원
- **자동 시작** — Windows 부팅 시 자동 실행 (선택)

---

## Usage / 사용법

### Quick Start / 빠른 시작

1. **설치 & 실행** — 설치 파일 실행 → 시스템 트레이에 아이콘 표시
2. **스크린샷 캡처** — `Win+Shift+S`로 화면 캡처 → 자동 저장
3. **텍스트 복사** — 아무 텍스트 복사 → 자동 기록
4. **경로/텍스트 복사** — 갤러리에서 클릭 한 번으로 복사
5. **빠른 접근** — `Alt+Shift+V`로 어디서든 앱 표시

### Path Formats / 경로 형식

```
Windows:  C:\Users\you\Pictures\CLIBuddy\screenshot_2026-02-12_14-30-45.png
WSL:      /mnt/c/Users/you/Pictures/CLIBuddy/screenshot_2026-02-12_14-30-45.png
```

### System Tray / 시스템 트레이

| Action | Result |
|--------|--------|
| 트레이 아이콘 좌클릭 | 윈도우 표시/포커스 |
| **Monitor Start/Stop** | 클립보드 감시 시작/중단 |
| **Open Folder** | 스크린샷 저장 폴더 열기 |
| **Show Window** | 앱 창 표시 |
| **Quit** | 앱 종료 |

---

## Settings / 설정

| Setting | Default | Description |
|---------|---------|-------------|
| Save Directory | `Pictures/CLIBuddy` | 스크린샷 저장 경로 |
| Polling Interval | `500ms` | 클립보드 확인 간격 (200–5000ms) |
| Max Screenshots | `100` | 최대 스크린샷 보관 수 |
| Auto Copy Path | `ON` | 캡처 시 파일 경로 자동 복사 |
| Auto Start | `OFF` | Windows 시작 시 자동 실행 |
| Language | `한국어` | 한국어 / English |
| Path Format | `Windows` | Windows / WSL |
| Capture Text | `ON` | 텍스트 클립보드 자동 저장 |
| Max Text Entries | `50` | 최대 텍스트 기록 수 |
| Global Shortcut | `Alt+Shift+V` | 앱 표시 단축키 |

---

## Tech Stack / 기술 스택

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

## Build from Source / 소스에서 빌드

**Prerequisites / 필수 조건:**
- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://rustup.rs/) ≥ 1.77
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows C++ workload)

```bash
git clone https://github.com/xcryptp/cli-buddy.git
cd cli-buddy
npm install
npm run tauri dev       # 개발 모드 (핫 리로드)
npm run tauri build     # 프로덕션 빌드
```

Build output: `src-tauri/target/release/bundle/`

---

## Contributing / 기여

Contributions are welcome! Feel free to open an issue or submit a pull request.

기여를 환영합니다! 이슈를 열거나 PR을 보내주세요.

---

## License

[MIT](LICENSE)

---

<p align="center">
  Made by <a href="https://github.com/xcryptp">xcryptp</a> · Built with Tauri + React + Rust
</p>
