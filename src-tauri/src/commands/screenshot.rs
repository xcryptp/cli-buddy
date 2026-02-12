use crate::state::AppState;
use crate::storage::file_manager::{FileManager, ScreenshotInfo};
use tauri::State;

#[tauri::command]
pub fn get_screenshots(state: State<'_, AppState>) -> Result<Vec<ScreenshotInfo>, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let file_manager = FileManager::new(&settings);
    file_manager.get_screenshot_list()
}

#[tauri::command]
pub fn delete_screenshot(filename: String, state: State<'_, AppState>) -> Result<(), String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let file_manager = FileManager::new(&settings);
    file_manager.delete_screenshot(&filename)
}

#[tauri::command]
pub fn get_save_directory(state: State<'_, AppState>) -> Result<String, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.save_directory.clone())
}
