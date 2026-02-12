use crate::state::AppState;
use crate::storage::file_manager::{FileManager, ScreenshotInfo};
use base64::Engine;
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

#[tauri::command]
pub fn get_image_base64(path: String) -> Result<String, String> {
    let data = std::fs::read(&path).map_err(|e| format!("Failed to read image: {}", e))?;
    let ext = std::path::Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "image/png",
    };
    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
    Ok(format!("data:{};base64,{}", mime, b64))
}
