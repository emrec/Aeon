mod daemon;
mod metadata;
mod transfer;
mod trust;
use iroh_blobs::ticket::BlobTicket;

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

#[tauri::command]
async fn share_file(state: tauri::State<'_, daemon::MockIrohClient>) -> Result<String, String> {
    let file_path = rfd::AsyncFileDialog::new()
        .set_title("Select File to Share")
        .pick_file()
        .await;

    if let Some(file_handle) = file_path {
        let path = file_handle.path().to_path_buf();
        let name = path.file_name().unwrap_or_default().to_string_lossy().into_owned();

        let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
        let size = metadata.len();

        println!("Importing file to Iroh-blobs: {:?}", path);
        let progress = state.store.add_path(&path);
        let res = progress.await.map_err(|e| format!("Failed to import file: {}", e))?;

        let addr = state.endpoint.addr();
        let ticket = BlobTicket::new(addr, res.hash, res.format);
        let ticket_str = ticket.to_string();

        {
            let mut guard = state.transfers.lock().unwrap();
            guard.push(transfer::TransferState {
                hash: res.hash.to_string(),
                name,
                progress: 100.0,
                size,
                speed: "0 KB/s".into(),
                eta: "-".into(),
                is_downloading: false,
                peers: 0,
            });
        }

        Ok(ticket_str)
    } else {
        Err("Selection cancelled".into())
    }
}

#[tauri::command]
async fn share_folder(state: tauri::State<'_, daemon::MockIrohClient>) -> Result<String, String> {
    let folder_path = rfd::AsyncFileDialog::new()
        .set_title("Select Folder to Share")
        .pick_folder()
        .await;

    if let Some(folder_handle) = folder_path {
        let path = folder_handle.path().to_path_buf();
        let name = path.file_name().unwrap_or_default().to_string_lossy().into_owned();

        println!("Importing folder to Iroh-blobs: {:?}", path);

        let progress = state.store.add_path_with_opts(iroh_blobs::api::blobs::AddPathOptions {
            path: path.clone(),
            mode: iroh_blobs::api::blobs::ImportMode::Copy,
            format: iroh_blobs::BlobFormat::HashSeq,
        });
        let res = progress.await.map_err(|e| format!("Failed to import folder: {}", e))?;

        let addr = state.endpoint.addr();
        let ticket = BlobTicket::new(addr, res.hash, res.format);
        let ticket_str = ticket.to_string();

        {
            let mut guard = state.transfers.lock().unwrap();
            guard.push(transfer::TransferState {
                hash: res.hash.to_string(),
                name,
                progress: 100.0,
                size: 0,
                speed: "0 KB/s".into(),
                eta: "-".into(),
                is_downloading: false,
                peers: 0,
            });
        }

        Ok(ticket_str)
    } else {
        Err("Selection cancelled".into())
    }
}

#[tauri::command]
async fn remove_transfer(state: tauri::State<'_, daemon::MockIrohClient>, hash: String) -> Result<(), String> {
    let mut guard = state.transfers.lock().unwrap();
    guard.retain(|x| x.hash != hash);
    Ok(())
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
        .invoke_handler(tauri::generate_handler![publish, query, download, get_transfers, get_gossip_peers, share_file, share_folder, remove_transfer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
