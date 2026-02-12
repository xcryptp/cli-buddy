use crate::config::AppSettings;
use base64::Engine;
use chrono::Local;
use image::imageops::FilterType;
use image::ImageFormat;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotInfo {
    pub filename: String,
    pub path: String,
    pub thumbnail: String,
    pub created_at: String,
    pub size_bytes: u64,
}

pub struct FileManager {
    save_dir: PathBuf,
    thumbnail_size: u32,
}

impl FileManager {
    pub fn new(settings: &AppSettings) -> Self {
        let save_dir = PathBuf::from(&settings.save_directory);
        Self {
            save_dir,
            thumbnail_size: settings.thumbnail_size,
        }
    }

    pub fn ensure_directories(&self) -> Result<(), String> {
        fs::create_dir_all(&self.save_dir).map_err(|e| e.to_string())?;
        fs::create_dir_all(self.thumbnails_dir()).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn thumbnails_dir(&self) -> PathBuf {
        self.save_dir.join(".thumbnails")
    }

    pub fn save_screenshot(&self, png_data: &[u8]) -> Result<ScreenshotInfo, String> {
        self.ensure_directories()?;

        let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
        let filename = format!("screenshot_{}.png", timestamp);
        let filepath = self.save_dir.join(&filename);

        // Save full image
        fs::write(&filepath, png_data).map_err(|e| format!("Failed to save screenshot: {}", e))?;

        // Update latest.png
        let latest_path = self.save_dir.join("latest.png");
        let _ = fs::copy(&filepath, &latest_path);

        // Generate thumbnail
        let thumbnail = self.generate_thumbnail(png_data, &filename)?;

        let size_bytes = png_data.len() as u64;
        let created_at = Local::now().format("%Y-%m-%dT%H:%M:%S%z").to_string();

        Ok(ScreenshotInfo {
            filename,
            path: filepath.to_string_lossy().to_string(),
            thumbnail,
            created_at,
            size_bytes,
        })
    }

    fn generate_thumbnail(&self, png_data: &[u8], filename: &str) -> Result<String, String> {
        let img =
            image::load_from_memory(png_data).map_err(|e| format!("Failed to load image: {}", e))?;

        let thumbnail = img.resize(
            self.thumbnail_size,
            self.thumbnail_size,
            FilterType::Lanczos3,
        );

        // Save thumbnail file
        let thumb_path = self.thumbnails_dir().join(filename);
        thumbnail
            .save_with_format(&thumb_path, ImageFormat::Png)
            .map_err(|e| format!("Failed to save thumbnail: {}", e))?;

        // Return base64 encoded thumbnail
        let mut buf = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut buf);
        thumbnail
            .write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

        let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
        Ok(format!("data:image/png;base64,{}", b64))
    }

    pub fn get_screenshot_list(&self) -> Result<Vec<ScreenshotInfo>, String> {
        if !self.save_dir.exists() {
            return Ok(Vec::new());
        }

        let mut screenshots: Vec<ScreenshotInfo> = Vec::new();

        let entries =
            fs::read_dir(&self.save_dir).map_err(|e| format!("Failed to read dir: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("screenshot_") && name.ends_with(".png") {
                    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
                    let thumbnail = self.get_or_create_thumbnail(&path, name)?;

                    let created_at = metadata
                        .created()
                        .or_else(|_| metadata.modified())
                        .map(|t| {
                            let datetime: chrono::DateTime<Local> = t.into();
                            datetime.format("%Y-%m-%dT%H:%M:%S%z").to_string()
                        })
                        .unwrap_or_default();

                    screenshots.push(ScreenshotInfo {
                        filename: name.to_string(),
                        path: path.to_string_lossy().to_string(),
                        thumbnail,
                        created_at,
                        size_bytes: metadata.len(),
                    });
                }
            }
        }

        // Sort by filename descending (newest first)
        screenshots.sort_by(|a, b| b.filename.cmp(&a.filename));

        Ok(screenshots)
    }

    fn get_or_create_thumbnail(&self, image_path: &Path, filename: &str) -> Result<String, String> {
        let thumb_path = self.thumbnails_dir().join(filename);

        if thumb_path.exists() {
            let data = fs::read(&thumb_path).map_err(|e| e.to_string())?;
            let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
            return Ok(format!("data:image/png;base64,{}", b64));
        }

        // Generate from original
        let png_data = fs::read(image_path).map_err(|e| e.to_string())?;
        self.generate_thumbnail(&png_data, filename)
    }

    pub fn delete_screenshot(&self, filename: &str) -> Result<(), String> {
        let filepath = self.save_dir.join(filename);
        if filepath.exists() {
            fs::remove_file(&filepath).map_err(|e| e.to_string())?;
        }
        let thumb_path = self.thumbnails_dir().join(filename);
        if thumb_path.exists() {
            let _ = fs::remove_file(&thumb_path);
        }
        Ok(())
    }

    pub fn cleanup_old(&self, max_count: u32) -> Result<u32, String> {
        let mut screenshots = self.get_screenshot_list()?;
        if screenshots.len() <= max_count as usize {
            return Ok(0);
        }

        // Screenshots are sorted newest first, remove from the end
        let to_remove = screenshots.split_off(max_count as usize);
        let count = to_remove.len() as u32;

        for info in to_remove {
            let _ = self.delete_screenshot(&info.filename);
        }

        Ok(count)
    }

    pub fn get_image_data(&self, filename: &str) -> Result<Vec<u8>, String> {
        let filepath = self.save_dir.join(filename);
        fs::read(&filepath).map_err(|e| format!("Failed to read image: {}", e))
    }
}
