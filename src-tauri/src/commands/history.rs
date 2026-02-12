use crate::state::AppState;
use crate::storage::file_manager::FileManager;
use crate::storage::text_history::TextEntry;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum ClipboardEntry {
    #[serde(rename = "image")]
    Image(crate::storage::file_manager::ScreenshotInfo),
    #[serde(rename = "text")]
    Text(TextEntry),
}

#[tauri::command]
pub fn get_clipboard_history(state: State<AppState>) -> Result<Vec<ClipboardEntry>, String> {
    let settings = state
        .settings
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    let file_manager = FileManager::new(&settings);
    let screenshots = file_manager.get_screenshot_list()?;
    let text_entries = state
        .text_history
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    let mut entries: Vec<ClipboardEntry> = Vec::new();

    for s in screenshots {
        entries.push(ClipboardEntry::Image(s));
    }
    for t in text_entries.get_entries() {
        entries.push(ClipboardEntry::Text(t.clone()));
    }

    // Sort by created_at descending
    entries.sort_by(|a, b| {
        let a_time = match a {
            ClipboardEntry::Image(s) => &s.created_at,
            ClipboardEntry::Text(t) => &t.created_at,
        };
        let b_time = match b {
            ClipboardEntry::Image(s) => &s.created_at,
            ClipboardEntry::Text(t) => &t.created_at,
        };
        b_time.cmp(a_time)
    });

    Ok(entries)
}

#[tauri::command]
pub fn get_text_history(state: State<AppState>) -> Result<Vec<TextEntry>, String> {
    let th = state
        .text_history
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    Ok(th.get_entries().to_vec())
}

#[tauri::command]
pub fn delete_text_entry(id: String, state: State<AppState>) -> Result<bool, String> {
    let mut th = state
        .text_history
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    Ok(th.delete_entry(&id))
}

#[tauri::command]
pub fn clear_text_history(state: State<AppState>) -> Result<(), String> {
    let mut th = state
        .text_history
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    th.clear();
    Ok(())
}

#[tauri::command]
pub fn paste_from_history(content: String, entry_type: String) -> Result<(), String> {
    let mut clipboard =
        arboard::Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;

    match entry_type.as_str() {
        "text" => {
            clipboard
                .set_text(&content)
                .map_err(|e| format!("Failed to set text: {}", e))?;
        }
        "image" => {
            // For images, content is the file path
            let data =
                std::fs::read(&content).map_err(|e| format!("Failed to read image: {}", e))?;
            let img = image::load_from_memory(&data)
                .map_err(|e| format!("Failed to decode image: {}", e))?;
            let rgba = img.to_rgba8();
            let (w, h) = rgba.dimensions();
            let img_data = arboard::ImageData {
                width: w as usize,
                height: h as usize,
                bytes: std::borrow::Cow::Owned(rgba.into_raw()),
            };
            clipboard
                .set_image(img_data)
                .map_err(|e| format!("Failed to set image: {}", e))?;
        }
        _ => return Err("Unknown entry type".to_string()),
    }

    Ok(())
}
