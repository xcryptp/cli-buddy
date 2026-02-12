use crate::config::AppSettings;
use crate::storage::file_manager::{FileManager, ScreenshotInfo};
use crate::storage::hash::sha256_hash;
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

    pub fn start(&self, app_handle: AppHandle, settings: Arc<Mutex<AppSettings>>) {
        if self.running.load(Ordering::Relaxed) {
            return;
        }

        self.running.store(true, Ordering::Relaxed);
        let running = self.running.clone();

        std::thread::spawn(move || {
            info!("Clipboard watcher started");
            let mut last_hash: Option<String> = None;

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

                match Self::check_clipboard(&mut last_hash, &file_manager, &current_settings, &app_handle) {
                    Ok(Some(info)) => {
                        info!("New screenshot saved: {}", info.filename);
                        let _ = app_handle.emit("new-screenshot", &info);
                    }
                    Ok(None) => {}
                    Err(e) => {
                        if !e.contains("no image") && !e.contains("No image") {
                            error!("Clipboard check error: {}", e);
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

    fn check_clipboard(
        last_hash: &mut Option<String>,
        file_manager: &FileManager,
        settings: &AppSettings,
        _app_handle: &AppHandle,
    ) -> Result<Option<ScreenshotInfo>, String> {
        let mut clipboard = Clipboard::new().map_err(|e| format!("Clipboard error: {}", e))?;

        let img_data = clipboard
            .get_image()
            .map_err(|e| format!("No image: {}", e))?;

        // Convert to PNG bytes
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

        // Hash comparison for dedup
        let hash = sha256_hash(&png_data);

        if let Some(ref last) = last_hash {
            if *last == hash {
                return Ok(None);
            }
        }

        *last_hash = Some(hash);

        // Save screenshot
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
}
