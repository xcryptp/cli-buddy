use crate::config::AppSettings;
use crate::monitor::clipboard_watcher::ClipboardWatcher;
use crate::storage::text_history::TextHistory;
use std::sync::{Arc, Mutex};

pub struct AppState {
    pub settings: Arc<Mutex<AppSettings>>,
    pub watcher: ClipboardWatcher,
    pub text_history: Arc<Mutex<TextHistory>>,
}

impl AppState {
    pub fn new() -> Self {
        let settings = AppSettings::load();
        let text_history = TextHistory::new(settings.max_text_entries as usize);
        Self {
            settings: Arc::new(Mutex::new(settings)),
            watcher: ClipboardWatcher::new(),
            text_history: Arc::new(Mutex::new(text_history)),
        }
    }
}
