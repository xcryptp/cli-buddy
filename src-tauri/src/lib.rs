mod commands;
mod config;
mod monitor;
mod state;
mod storage;
mod tray;

use commands::{clipboard, monitor as monitor_cmd, screenshot, settings};
use state::AppState;
use tauri::Manager;

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
        ])
        .setup(|app| {
            // Setup system tray
            let handle = app.handle();
            tray::tray_icon::setup_tray(handle)?;

            // Auto-start monitoring
            let state = app.state::<AppState>();
            state.watcher.start(handle.clone(), state.settings.clone());

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent window close, hide to tray instead
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
