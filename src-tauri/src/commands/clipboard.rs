use crate::state::AppState;
use crate::storage::file_manager::FileManager;
use arboard::Clipboard;
use image::ImageFormat;
use tauri::State;

/// Convert Windows path to WSL path
fn to_wsl_path(win_path: &str) -> String {
    if win_path.len() >= 3 && win_path.as_bytes()[1] == b':' {
        let drive = (win_path.as_bytes()[0] as char).to_ascii_lowercase();
        let rest = &win_path[2..].replace('\\', "/");
        format!("/mnt/{}{}", drive, rest)
    } else {
        win_path.replace('\\', "/")
    }
}

fn format_path(path: &str, path_format: &str) -> String {
    match path_format {
        "wsl" => to_wsl_path(path),
        _ => path.to_string(),
    }
}

#[tauri::command]
pub fn copy_path(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let formatted = format_path(&path, &settings.path_format);
    let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
    clipboard
        .set_text(&formatted)
        .map_err(|e| format!("Failed to copy path: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn copy_image(filename: String, state: State<'_, AppState>) -> Result<(), String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let file_manager = FileManager::new(&settings);

    let png_data = file_manager.get_image_data(&filename)?;

    let img =
        image::load_from_memory_with_format(&png_data, ImageFormat::Png)
            .map_err(|e| format!("Failed to load image: {}", e))?;

    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();

    let img_data = arboard::ImageData {
        width: width as usize,
        height: height as usize,
        bytes: rgba.into_raw().into(),
    };

    let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;
    clipboard
        .set_image(img_data)
        .map_err(|e| format!("Failed to copy image: {}", e))?;

    Ok(())
}
