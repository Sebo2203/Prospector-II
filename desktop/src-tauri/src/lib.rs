#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![quit_app])
        .run(tauri::generate_context!())
        .expect("error while running Prospector II desktop app");
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}
