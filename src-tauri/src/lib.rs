mod commands;
mod config;
mod monitor;
mod state;
mod storage;
mod tray;

use commands::{clipboard, history, monitor as monitor_cmd, screenshot, settings};
use state::AppState;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

fn create_popup_window(app: &tauri::AppHandle) -> Result<(), String> {
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

    WebviewWindowBuilder::new(
        app,
        "clipboard-popup",
        WebviewUrl::App("index.html?mode=popup".into()),
    )
    .title("Clipboard History")
    .inner_size(350.0, 450.0)
    .decorations(false)
    .always_on_top(true)
    .resizable(false)
    .skip_taskbar(true)
    .center()
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
            monitor_cmd::toggle_monitor,
            monitor_cmd::get_monitor_status,
            settings::get_settings,
            settings::update_settings,
            history::get_clipboard_history,
            history::get_text_history,
            history::delete_text_entry,
            history::clear_text_history,
            history::paste_from_history,
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
