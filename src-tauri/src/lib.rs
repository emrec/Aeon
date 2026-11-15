mod daemon;
mod metadata;
mod torrent;
mod transfer;
mod trust;

use iroh_blobs::ticket::BlobTicket;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedTransfer {
    pub id: String,
    pub hash: String,
    pub name: String,
    pub progress: f64,
    pub size: u64,
    pub down_speed: String,
    pub up_speed: String,
    pub down_speed_bytes: u64,
    pub up_speed_bytes: u64,
    pub eta: String,
    pub status: String,
    pub seeds: usize,
    pub peers: usize,
    pub ratio: f64,
    pub protocol: String, // "BitTorrent" | "Iroh"
    pub is_torrent: bool,
    pub output_folder: String,
}

fn calc_dir_size(path: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_dir() {
                    total += calc_dir_size(&entry.path());
                } else {
                    total += meta.len();
                }
            }
        }
    }
    total
}

#[tauri::command]
async fn publish(
    state: tauri::State<'_, daemon::MockIrohClient>,
    name: String,
    size: u64,
    hash: String,
    channel: String,
) -> Result<(), String> {
    metadata::publish_metadata(
        &state,
        metadata::FileMetadata {
            name,
            size,
            hash,
            channel,
            pubkey: String::new(),
            created_at: 0,
            is_trusted: true,
        },
    )
    .await
}

#[tauri::command]
async fn query(
    state: tauri::State<'_, daemon::MockIrohClient>,
    channel: String,
) -> Result<Vec<metadata::FileMetadata>, String> {
    metadata::query_metadata(&state, &channel).await
}

#[tauri::command]
async fn download(
    state: tauri::State<'_, daemon::MockIrohClient>,
    hash: String,
    output_folder: Option<String>,
) -> Result<(), String> {
    if hash.starts_with("magnet:?") || (hash.len() == 40 && !hash.contains('.')) {
        state
            .torrent
            .add_magnet(&hash, output_folder)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        transfer::start_download(&state, hash, output_folder).await
    }
}

#[tauri::command]
async fn add_torrent_magnet(
    state: tauri::State<'_, daemon::MockIrohClient>,
    magnet: String,
    output_folder: Option<String>,
) -> Result<String, String> {
    state
        .torrent
        .add_magnet(&magnet, output_folder)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_torrent_file(
    state: tauri::State<'_, daemon::MockIrohClient>,
    output_folder: Option<String>,
) -> Result<String, String> {
    let file_path = rfd::AsyncFileDialog::new()
        .set_title("Select .torrent File")
        .add_filter("Torrent Files", &["torrent"])
        .pick_file()
        .await;

    if let Some(file_handle) = file_path {
        let path = file_handle.path().to_path_buf();
        let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
        state
            .torrent
            .add_torrent_bytes(bytes, output_folder)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Selection cancelled".into())
    }
}

#[tauri::command]
async fn add_torrent_bytes_cmd(
    state: tauri::State<'_, daemon::MockIrohClient>,
    bytes: Vec<u8>,
    output_folder: Option<String>,
) -> Result<String, String> {
    state
        .torrent
        .add_torrent_bytes(bytes, output_folder)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn pick_download_folder() -> Result<Option<String>, String> {
    let folder = rfd::AsyncFileDialog::new()
        .set_title("Select Download Folder")
        .pick_folder()
        .await;
    Ok(folder.map(|f| f.path().to_string_lossy().to_string()))
}

#[tauri::command]
async fn get_all_transfers(
    state: tauri::State<'_, daemon::MockIrohClient>,
) -> Result<Vec<UnifiedTransfer>, String> {
    let mut unified = Vec::new();

    // 1. BitTorrent items
    let torrents = state.torrent.list_torrents();
    for t in torrents {
        unified.push(UnifiedTransfer {
            id: t.id.to_string(),
            hash: t.info_hash,
            name: t.name,
            progress: t.progress,
            size: t.total_bytes,
            down_speed: t.down_speed,
            up_speed: t.up_speed,
            down_speed_bytes: t.down_speed_bytes,
            up_speed_bytes: t.up_speed_bytes,
            eta: t.eta,
            status: t.status,
            seeds: t.seeds,
            peers: t.peers,
            ratio: t.ratio,
            protocol: "BitTorrent".to_string(),
            is_torrent: true,
            output_folder: t.output_folder,
        });
    }

    // 2. Iroh items
    {
        let guard = state.transfers.lock().unwrap();
        for item in guard.iter() {
            let status = if item.is_paused {
                "Paused".to_string()
            } else if item.is_downloading {
                if item.progress >= 100.0 {
                    "Completed".to_string()
                } else {
                    "Downloading".to_string()
                }
            } else {
                "Seeding".to_string()
            };

            unified.push(UnifiedTransfer {
                id: item.hash.clone(),
                hash: item.hash.clone(),
                name: item.name.clone(),
                progress: item.progress as f64,
                size: item.size,
                down_speed: if item.is_paused {
                    "0 KB/s".to_string()
                } else {
                    item.speed.clone()
                },
                up_speed: "0 KB/s".to_string(),
                down_speed_bytes: if item.is_paused { 0 } else { item.down_speed_bytes },
                up_speed_bytes: item.up_speed_bytes,
                eta: if item.is_paused {
                    "∞".to_string()
                } else {
                    item.eta.clone()
                },
                status,
                seeds: item.peers as usize,
                peers: item.peers as usize,
                ratio: 1.0,
                protocol: "Iroh".to_string(),
                is_torrent: false,
                output_folder: item.output_folder.clone(),
            });
        }
    }

    Ok(unified)
}

#[tauri::command]
async fn pause_transfer(
    state: tauri::State<'_, daemon::MockIrohClient>,
    id: String,
    is_torrent: bool,
) -> Result<(), String> {
    if is_torrent {
        state.torrent.pause(&id).await.map_err(|e| e.to_string())?;
    } else {
        let mut guard = state.transfers.lock().unwrap();
        if let Some(t) = guard.iter_mut().find(|x| x.hash == id) {
            t.is_paused = true;
            t.down_speed_bytes = 0;
            t.speed = "0 KB/s".into();
        }
    }
    Ok(())
}

#[tauri::command]
async fn resume_transfer(
    state: tauri::State<'_, daemon::MockIrohClient>,
    id: String,
    is_torrent: bool,
) -> Result<(), String> {
    if is_torrent {
        state.torrent.resume(&id).await.map_err(|e| e.to_string())?;
    } else {
        let mut guard = state.transfers.lock().unwrap();
        if let Some(t) = guard.iter_mut().find(|x| x.hash == id) {
            t.is_paused = false;
        }
    }
    Ok(())
}

#[tauri::command]
async fn remove_transfer(
    state: tauri::State<'_, daemon::MockIrohClient>,
    id: Option<String>,
    hash: Option<String>,
    is_torrent: Option<bool>,
    delete_files: Option<bool>,
) -> Result<(), String> {
    let target_id = id.or(hash).ok_or_else(|| "Missing transfer id".to_string())?;
    if is_torrent.unwrap_or(false) {
        state
            .torrent
            .delete(&target_id, delete_files.unwrap_or(false))
            .await
            .map_err(|e| e.to_string())?;
    } else {
        let mut guard = state.transfers.lock().unwrap();
        guard.retain(|x| x.hash != target_id);
    }
    Ok(())
}

#[tauri::command]
async fn get_media_files(
    state: tauri::State<'_, daemon::MockIrohClient>,
    id: String,
) -> Result<Vec<torrent::MediaFile>, String> {
    Ok(state.torrent.get_media_files(&id))
}

#[tauri::command]
async fn get_torrent_details(
    state: tauri::State<'_, daemon::MockIrohClient>,
    id: String,
) -> Result<Option<serde_json::Value>, String> {
    if let Some(details) = state.torrent.get_details(&id) {
        Ok(Some(serde_json::to_value(details).map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn get_transfers(
    state: tauri::State<'_, daemon::MockIrohClient>,
) -> Result<Vec<transfer::TransferState>, String> {
    let guard = state.transfers.lock().unwrap();
    Ok(guard.clone())
}

#[tauri::command]
async fn get_gossip_peers(state: tauri::State<'_, daemon::MockIrohClient>) -> Result<u32, String> {
    let torrent_peers: usize = state
        .torrent
        .list_torrents()
        .iter()
        .map(|t| t.peers)
        .sum();
    let iroh_peers: u32 = state
        .transfers
        .lock()
        .unwrap()
        .iter()
        .map(|t| t.peers)
        .sum();
    Ok(state.peer_count + (torrent_peers as u32) + iroh_peers)
}

#[tauri::command]
async fn get_trust_data(
    state: tauri::State<'_, daemon::MockIrohClient>,
) -> Result<trust::TrustData, String> {
    let guard = state.trust.lock().unwrap();
    Ok(guard.data.clone())
}

#[tauri::command]
async fn add_trust_node(
    state: tauri::State<'_, daemon::MockIrohClient>,
    alias: String,
    pubkey: String,
    node_type: String,
) -> Result<trust::TrustData, String> {
    let mut guard = state.trust.lock().unwrap();
    Ok(guard.add_trusted(alias, pubkey, node_type))
}

#[tauri::command]
async fn remove_trust_node(
    state: tauri::State<'_, daemon::MockIrohClient>,
    pubkey: String,
) -> Result<trust::TrustData, String> {
    let mut guard = state.trust.lock().unwrap();
    Ok(guard.remove_trusted(&pubkey))
}

#[tauri::command]
async fn block_trust_node(
    state: tauri::State<'_, daemon::MockIrohClient>,
    pubkey: String,
    alias: String,
    reason: Option<String>,
) -> Result<trust::TrustData, String> {
    let mut guard = state.trust.lock().unwrap();
    Ok(guard.block_node(pubkey, alias, reason))
}

#[tauri::command]
async fn unblock_trust_node(
    state: tauri::State<'_, daemon::MockIrohClient>,
    pubkey: String,
) -> Result<trust::TrustData, String> {
    let mut guard = state.trust.lock().unwrap();
    Ok(guard.unblock_node(&pubkey))
}

#[tauri::command]
async fn share_file(state: tauri::State<'_, daemon::MockIrohClient>) -> Result<String, String> {
    let file_path = rfd::AsyncFileDialog::new()
        .set_title("Select File to Share")
        .pick_file()
        .await;

    if let Some(file_handle) = file_path {
        let path = file_handle.path().to_path_buf();
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
        let folder = path
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
        let size = metadata.len();

        let progress = state.store.add_path(&path);
        let res = progress
            .await
            .map_err(|e| format!("Failed to import file: {}", e))?;

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
                down_speed_bytes: 0,
                up_speed_bytes: 0,
                eta: "-".into(),
                is_downloading: false,
                is_paused: false,
                peers: 1,
                output_folder: folder,
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
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
        let folder_str = path.to_string_lossy().to_string();
        let size = calc_dir_size(&path);

        let progress = state
            .store
            .add_path_with_opts(iroh_blobs::api::blobs::AddPathOptions {
                path: path.clone(),
                mode: iroh_blobs::api::blobs::ImportMode::Copy,
                format: iroh_blobs::BlobFormat::HashSeq,
            });
        let res = progress
            .await
            .map_err(|e| format!("Failed to import folder: {}", e))?;

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
                down_speed_bytes: 0,
                up_speed_bytes: 0,
                eta: "-".into(),
                is_downloading: false,
                is_paused: false,
                peers: 1,
                output_folder: folder_str,
            });
        }

        Ok(ticket_str)
    } else {
        Err("Selection cancelled".into())
    }
}

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            let client = tauri::async_runtime::block_on(async {
                daemon::start_memory_node(app_data_dir)
                    .await
                    .expect("Failed to start Iroh node")
            });
            app.manage(client);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            publish,
            query,
            download,
            add_torrent_magnet,
            add_torrent_file,
            add_torrent_bytes_cmd,
            pick_download_folder,
            get_all_transfers,
            pause_transfer,
            resume_transfer,
            remove_transfer,
            get_torrent_details,
            get_media_files,
            get_transfers,
            get_gossip_peers,
            get_trust_data,
            add_trust_node,
            remove_trust_node,
            block_trust_node,
            unblock_trust_node,
            share_file,
            share_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
