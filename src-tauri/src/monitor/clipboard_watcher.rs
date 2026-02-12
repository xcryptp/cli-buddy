use crate::config::AppSettings;
use crate::storage::file_manager::{FileManager, ScreenshotInfo};
use crate::storage::hash::sha256_hash;
use crate::storage::text_history::{TextEntry, TextHistory};
use arboard::Clipboard;
use image::ImageFormat;
use log::{error, info};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct ClipboardWatcher {
    running: Arc<AtomicBool>,
}

impl ClipboardWatcher {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::Relaxed)
    }

    pub fn start(
        &self,
        app_handle: AppHandle,
        settings: Arc<Mutex<AppSettings>>,
        text_history: Arc<Mutex<TextHistory>>,
    ) {
        if self.running.load(Ordering::Relaxed) {
            return;
        }

        self.running.store(true, Ordering::Relaxed);
        let running = self.running.clone();

        std::thread::spawn(move || {
            info!("Clipboard watcher started");
            let mut last_image_hash: Option<String> = None;
            let mut last_text_hash: Option<String> = None;

            // Initialize last_text_hash from most recent entry
            if let Ok(th) = text_history.lock() {
                last_text_hash = th.last_hash().map(|s| s.to_string());
            }

            while running.load(Ordering::Relaxed) {
                let current_settings = match settings.lock() {
                    Ok(s) => s.clone(),
                    Err(_) => {
                        std::thread::sleep(Duration::from_millis(500));
                        continue;
                    }
                };

                let interval = Duration::from_millis(current_settings.polling_interval_ms);
                let file_manager = FileManager::new(&current_settings);

                if let Err(e) = file_manager.ensure_directories() {
                    error!("Failed to create directories: {}", e);
                }

                // Try image first
                match Self::check_clipboard_image(
                    &mut last_image_hash,
                    &file_manager,
                    &current_settings,
                ) {
                    Ok(Some(info)) => {
                        info!("New screenshot saved: {}", info.filename);
                        let _ = app_handle.emit("new-screenshot", &info);
                    }
                    Ok(None) => {
                        // No new image — check text if enabled
                        if current_settings.capture_text {
                            match Self::check_clipboard_text(
                                &mut last_text_hash,
                                &text_history,
                                &current_settings,
                            ) {
                                Ok(Some(entry)) => {
                                    info!("New text entry: {}", entry.id);
                                    let _ = app_handle.emit("new-text-entry", &entry);
                                }
                                Ok(None) => {}
                                Err(e) => {
                                    if !e.contains("no text") && !e.contains("No text") {
                                        error!("Text check error: {}", e);
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        if !e.contains("no image") && !e.contains("No image") {
                            error!("Clipboard check error: {}", e);
                        }
                        // Even if image check errors, try text
                        if current_settings.capture_text {
                            match Self::check_clipboard_text(
                                &mut last_text_hash,
                                &text_history,
                                &current_settings,
                            ) {
                                Ok(Some(entry)) => {
                                    info!("New text entry: {}", entry.id);
                                    let _ = app_handle.emit("new-text-entry", &entry);
                                }
                                Ok(None) => {}
                                Err(_) => {}
                            }
                        }
                    }
                }

                std::thread::sleep(interval);
            }

            info!("Clipboard watcher stopped");
        });
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Relaxed);
    }

    fn format_path(path: &str, path_format: &str) -> String {
        match path_format {
            "wsl" => {
                if path.len() >= 3 && path.as_bytes()[1] == b':' {
                    let drive = (path.as_bytes()[0] as char).to_ascii_lowercase();
                    let rest = &path[2..].replace('\\', "/");
                    format!("/mnt/{}{}", drive, rest)
                } else {
                    path.replace('\\', "/")
                }
            }
            _ => path.to_string(),
        }
    }

    fn check_clipboard_image(
        last_hash: &mut Option<String>,
        file_manager: &FileManager,
        settings: &AppSettings,
    ) -> Result<Option<ScreenshotInfo>, String> {
        let mut clipboard =
            Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;

        let img_data = clipboard
            .get_image()
            .map_err(|e| format!("No image: {}", e))?;

        let rgba_image = image::RgbaImage::from_raw(
            img_data.width as u32,
            img_data.height as u32,
            img_data.bytes.into_owned(),
        )
        .ok_or_else(|| "Failed to create image from clipboard data".to_string())?;

        let mut png_data = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_data);
        rgba_image
            .write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;

        let hash = sha256_hash(&png_data);

        if let Some(ref last) = last_hash {
            if *last == hash {
                return Ok(None);
            }
        }

        *last_hash = Some(hash);

        let info = file_manager.save_screenshot(&png_data)?;

        // Auto-copy path to clipboard if enabled
        if settings.auto_copy_path {
            if let Ok(mut cb) = Clipboard::new() {
                let formatted = Self::format_path(&info.path, &settings.path_format);
                let _ = cb.set_text(&formatted);
            }
        }

        // Cleanup old screenshots
        if settings.max_screenshots > 0 {
            let _ = file_manager.cleanup_old(settings.max_screenshots);
        }

        Ok(Some(info))
    }

    fn check_clipboard_text(
        last_text_hash: &mut Option<String>,
        text_history: &Arc<Mutex<TextHistory>>,
        settings: &AppSettings,
    ) -> Result<Option<TextEntry>, String> {
        let mut clipboard =
            Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;

        let text = clipboard
            .get_text()
            .map_err(|e| format!("No text: {}", e))?;

        // Skip empty or whitespace-only
        if text.trim().is_empty() {
            return Ok(None);
        }

        let hash = sha256_hash(text.as_bytes());

        if let Some(ref last) = last_text_hash {
            if *last == hash {
                return Ok(None);
            }
        }

        *last_text_hash = Some(hash);

        let mut th = text_history
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        th.set_max_entries(settings.max_text_entries as usize);
        Ok(th.add_entry(&text))
    }
}
