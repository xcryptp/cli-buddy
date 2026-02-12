use crate::config::AppSettings;
use crate::monitor::clipboard_watcher::ClipboardWatcher;
use std::sync::{Arc, Mutex};

pub struct AppState {
    pub settings: Arc<Mutex<AppSettings>>,
    pub watcher: ClipboardWatcher,
}

impl AppState {
    pub fn new() -> Self {
        let settings = AppSettings::load();
        Self {
            settings: Arc::new(Mutex::new(settings)),
            watcher: ClipboardWatcher::new(),
        }
    }
}
