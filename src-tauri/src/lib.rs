mod commands;
mod config;
mod monitor;
mod state;
mod storage;
mod tray;

use commands::{clipboard, history, monitor as monitor_cmd, screenshot, settings, system};
use state::AppState;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[cfg(target_os = "windows")]
fn get_cursor_position() -> Option<(f64, f64)> {
    #[repr(C)]
    struct POINT {
        x: i32,
        y: i32,
    }
    extern "system" {
        fn GetCursorPos(lp_point: *mut POINT) -> i32;
        fn GetDpiForSystem() -> u32;
    }
    unsafe {
        let mut point = std::mem::MaybeUninit::<POINT>::uninit();
        if GetCursorPos(point.as_mut_ptr()) != 0 {
            let point = point.assume_init();
            let dpi = GetDpiForSystem();
            let scale = dpi as f64 / 96.0;
            Some((point.x as f64 / scale, point.y as f64 / scale))
        } else {
            None
        }
    }
}

pub fn create_popup_window(app: &tauri::AppHandle) -> Result<(), String> {
    use tauri::WebviewUrl;
    use tauri::webview::WebviewWindowBuilder;

    // If already exists, toggle visibility
    if let Some(win) = app.get_webview_window("clipboard-popup") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.close();
        } else {
            let _ = win.show();
            let _ = win.set_focus();
        }
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(
        app,
        "clipboard-popup",
        WebviewUrl::App("index.html?mode=popup".into()),
    )
    .title("Clipboard History")
    .inner_size(350.0, 450.0)
    .decorations(false)
    .always_on_top(true)
    .resizable(false)
    .skip_taskbar(true);

    // Position near cursor on Windows (DPI-aware logical coordinates)
    #[cfg(target_os = "windows")]
    {
        if let Some((x, y)) = get_cursor_position() {
            let popup_w = 350.0;
            let popup_h = 450.0;
            let popup_x = (x - popup_w / 2.0).max(0.0);
            let popup_y = (y - popup_h - 10.0).max(0.0);
            builder = builder.position(popup_x, popup_y);
        } else {
            builder = builder.center();
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        builder = builder.center();
    }

    builder
        .build()
        .map_err(|e| format!("Failed to create popup: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new().build(),
        )
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            clipboard::copy_path,
            clipboard::copy_image,
            screenshot::get_screenshots,
            screenshot::delete_screenshot,
            screenshot::get_save_directory,
            screenshot::get_image_base64,
            monitor_cmd::toggle_monitor,
            monitor_cmd::get_monitor_status,
            settings::get_settings,
            settings::update_settings,
            history::get_clipboard_history,
            history::get_text_history,
            history::delete_text_entry,
            history::clear_text_history,
            history::paste_from_history,
            system::get_vmmem_stats,
            system::get_claude_sessions,
            system::restart_wsl,
        ])
        .setup(|app| {
            // Setup system tray
            let handle = app.handle();
            tray::tray_icon::setup_tray(handle)?;

            // Auto-start monitoring
            let state = app.state::<AppState>();
            state.watcher.start(
                handle.clone(),
                state.settings.clone(),
                state.text_history.clone(),
            );

            // Register global shortcut
            let shortcut_str = {
                let s = state.settings.lock().unwrap();
                s.global_shortcut.clone()
            };

            let app_handle = handle.clone();
            if let Ok(shortcut) = shortcut_str.parse::<tauri_plugin_global_shortcut::Shortcut>() {
                let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = create_popup_window(&app_handle);
                    }
                });
            } else {
                log::warn!("Failed to parse global shortcut: {}", shortcut_str);
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let label = window.label();
                if label == "main" {
                    // Main window: hide to tray instead of closing
                    api.prevent_close();
                    let _ = window.hide();
                }
                // Popup windows: allow normal close (don't prevent)
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
