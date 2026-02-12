use crate::state::AppState;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let toggle_monitor = MenuItemBuilder::with_id("toggle_monitor", "Monitor: Start").build(app)?;
    let open_folder = MenuItemBuilder::with_id("open_folder", "Open Folder").build(app)?;
    let show_window = MenuItemBuilder::with_id("show_window", "Show Window").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[&toggle_monitor, &open_folder, &show_window, &quit])
        .build()?;

    TrayIconBuilder::new()
        .icon(tauri::image::Image::from_path("icons/icon.png").unwrap_or_else(|_| {
            // Fallback: use raw RGBA from included PNG via image crate
            let png_data = include_bytes!("../../icons/32x32.png");
            let img = image::load_from_memory(png_data).unwrap().to_rgba8();
            let (w, h) = img.dimensions();
            tauri::image::Image::new_owned(img.into_raw(), w, h)
        }))
        .menu(&menu)
        .tooltip("CLI Buddy")
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "toggle_monitor" => {
                let state = app.state::<AppState>();
                if state.watcher.is_running() {
                    state.watcher.stop();
                } else {
                    state.watcher.start(app.clone(), state.settings.clone(), state.text_history.clone());
                }
            }
            "open_folder" => {
                let state = app.state::<AppState>();
                let settings = state.settings.lock().unwrap();
                let dir = settings.save_directory.clone();
                let _ = open::that(&dir);
            }
            "show_window" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
