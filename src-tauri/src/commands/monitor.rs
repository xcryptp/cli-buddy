use crate::state::AppState;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn toggle_monitor(app_handle: AppHandle, state: State<'_, AppState>) -> Result<bool, String> {
    if state.watcher.is_running() {
        state.watcher.stop();
        Ok(false)
    } else {
        state.watcher.start(app_handle, state.settings.clone());
        Ok(true)
    }
}

#[tauri::command]
pub fn get_monitor_status(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(state.watcher.is_running())
}
