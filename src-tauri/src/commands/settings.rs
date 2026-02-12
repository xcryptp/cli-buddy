use crate::config::AppSettings;
use crate::state::AppState;
use tauri::{AppHandle, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn update_settings(
    app: AppHandle,
    new_settings: AppSettings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let old_shortcut_str = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        settings.global_shortcut.clone()
    };

    new_settings.save()?;

    let new_shortcut_str = new_settings.global_shortcut.clone();

    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    *settings = new_settings;
    drop(settings);

    // Re-register global shortcut if changed
    if old_shortcut_str != new_shortcut_str {
        // Unregister old
        if let Ok(old_shortcut) = old_shortcut_str.parse::<tauri_plugin_global_shortcut::Shortcut>() {
            let _ = app.global_shortcut().unregister(old_shortcut);
        }
        // Register new
        if let Ok(new_shortcut) = new_shortcut_str.parse::<tauri_plugin_global_shortcut::Shortcut>() {
            let app_handle = app.clone();
            let _ = app.global_shortcut().on_shortcut(new_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = crate::create_popup_window(&app_handle);
                }
            });
        }
    }

    Ok(())
}
