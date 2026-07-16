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
async fn download(state: tauri::State<'_, daemon::MockIrohClient>, hash: String) -> Result<(), String> {
    transfer::start_download(&state, hash).await
}

#[tauri::command]
async fn get_transfers(state: tauri::State<'_, daemon::MockIrohClient>) -> Result<Vec<transfer::TransferState>, String> {
    let guard = state.transfers.lock().unwrap();
    Ok(guard.clone())
}

#[tauri::command]
async fn get_gossip_peers(state: tauri::State<'_, daemon::MockIrohClient>) -> Result<u32, String> {
    Ok(state.peer_count)
}

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            let client = tauri::async_runtime::block_on(async {
                daemon::start_memory_node(app_data_dir).await.expect("Failed to start Iroh node")
            });
            app.manage(client);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![publish, query, download, get_transfers, get_gossip_peers])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
