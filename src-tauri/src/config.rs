use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub save_directory: String,
    pub polling_interval_ms: u64,
    pub auto_copy_path: bool,
    pub max_screenshots: u32,
    pub auto_start: bool,
    pub thumbnail_size: u32,
    pub language: String,
    pub path_format: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        let pictures_dir = dirs::picture_dir()
            .unwrap_or_else(|| PathBuf::from("C:\\Users\\Default\\Pictures"))
            .join("CLIBuddy");

        Self {
            save_directory: pictures_dir.to_string_lossy().to_string(),
            polling_interval_ms: 500,
            auto_copy_path: true,
            max_screenshots: 100,
            auto_start: false,
            thumbnail_size: 200,
            language: "ko".to_string(),
            path_format: "windows".to_string(),
        }
    }
}

impl AppSettings {
    pub fn config_path() -> PathBuf {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("cli-buddy");
        config_dir.join("settings.json")
    }

    pub fn load() -> Self {
        let path = Self::config_path();
        if path.exists() {
            match fs::read_to_string(&path) {
                Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
                Err(_) => Self::default(),
            }
        } else {
            let settings = Self::default();
            let _ = settings.save();
            settings
        }
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::config_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let content = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(&path, content).map_err(|e| e.to_string())?;
        Ok(())
    }
}
