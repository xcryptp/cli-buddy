use crate::storage::hash::sha256_hash;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const MAX_TEXT_BYTES: usize = 10 * 1024; // 10KB

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextEntry {
    pub id: String,
    pub content: String,
    pub preview: String,
    pub hash: String,
    pub created_at: String,
    pub char_count: usize,
}

pub struct TextHistory {
    entries: Vec<TextEntry>,
    file_path: PathBuf,
    max_entries: usize,
}

impl TextHistory {
    pub fn new(max_entries: usize) -> Self {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("cli-buddy");
        let file_path = config_dir.join("clipboard_history.json");

        let mut history = Self {
            entries: Vec::new(),
            file_path,
            max_entries,
        };
        history.load();
        history
    }

    fn load(&mut self) {
        if self.file_path.exists() {
            if let Ok(content) = fs::read_to_string(&self.file_path) {
                if let Ok(entries) = serde_json::from_str::<Vec<TextEntry>>(&content) {
                    self.entries = entries;
                }
            }
        }
    }

    fn save(&self) {
        if let Some(parent) = self.file_path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(content) = serde_json::to_string_pretty(&self.entries) {
            let _ = fs::write(&self.file_path, content);
        }
    }

    pub fn add_entry(&mut self, text: &str) -> Option<TextEntry> {
        // Truncate if over 10KB
        let content = if text.len() > MAX_TEXT_BYTES {
            &text[..MAX_TEXT_BYTES]
        } else {
            text
        };

        let hash = sha256_hash(content.as_bytes());

        // Deduplicate
        if self.entries.iter().any(|e| e.hash == hash) {
            return None;
        }

        let preview: String = content.chars().take(100).collect();
        let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
        let id = format!("text_{}", timestamp);

        let entry = TextEntry {
            id,
            content: content.to_string(),
            preview,
            hash,
            created_at: Local::now().format("%Y-%m-%dT%H:%M:%S%z").to_string(),
            char_count: content.chars().count(),
        };

        self.entries.insert(0, entry.clone());

        // Enforce max entries
        if self.entries.len() > self.max_entries {
            self.entries.truncate(self.max_entries);
        }

        self.save();
        Some(entry)
    }

    pub fn get_entries(&self) -> &[TextEntry] {
        &self.entries
    }

    pub fn delete_entry(&mut self, id: &str) -> bool {
        let len_before = self.entries.len();
        self.entries.retain(|e| e.id != id);
        if self.entries.len() != len_before {
            self.save();
            true
        } else {
            false
        }
    }

    pub fn clear(&mut self) {
        self.entries.clear();
        self.save();
    }

    pub fn set_max_entries(&mut self, max: usize) {
        self.max_entries = max;
    }

    pub fn last_hash(&self) -> Option<&str> {
        self.entries.first().map(|e| e.hash.as_str())
    }
}
