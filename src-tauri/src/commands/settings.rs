use crate::config::AppSettings;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn update_settings(
    new_settings: AppSettings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    new_settings.save()?;
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    *settings = new_settings;
    Ok(())
}
