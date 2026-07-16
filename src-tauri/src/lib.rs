mod daemon;
mod metadata;
mod transfer;
mod trust;

#[tauri::command]
async fn publish(state: tauri::State<'_, daemon::MockIrohClient>, name: String, size: u64, hash: String, channel: String) -> Result<(), String> {
    metadata::publish_metadata(&state, metadata::FileMetadata {
        name,
        size,
        hash,
        channel,
    })
    .await
}

#[tauri::command]
async fn query(state: tauri::State<'_, daemon::MockIrohClient>, channel: String) -> Result<Vec<metadata::FileMetadata>, String> {
    metadata::query_metadata(&state, &channel).await
}

#[tauri::command]
async fn download(hash: String) -> Result<(), String> {
    transfer::start_download(hash).await
}

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let client = tauri::async_runtime::block_on(async {
                daemon::start_memory_node().await.expect("Failed to start Iroh node")
            });
            app.manage(client);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![publish, query, download])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
