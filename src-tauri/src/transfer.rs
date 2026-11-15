use serde::{Deserialize, Serialize};
use std::str::FromStr;
use iroh_blobs::ticket::BlobTicket;
use futures::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferState {
    pub hash: String,
    pub name: String,
    pub progress: f32, // 0.0 to 100.0
    pub size: u64,
    pub speed: String,
    pub down_speed_bytes: u64,
    pub up_speed_bytes: u64,
    pub eta: String,
    pub is_downloading: bool,
    pub is_paused: bool,
    pub peers: u32,
    pub output_folder: String,
}

fn format_speed(bytes_per_sec: f64) -> String {
    let kb = bytes_per_sec / 1024.0;
    if kb > 1024.0 {
        format!("{:.1} MB/s", kb / 1024.0)
    } else if kb >= 1.0 {
        format!("{:.0} KB/s", kb)
    } else {
        "0 KB/s".to_string()
    }
}

pub async fn start_download(
    client: &crate::daemon::MockIrohClient,
    hash_or_ticket: String,
    custom_output: Option<String>,
) -> Result<(), String> {
    let output_folder = custom_output
        .unwrap_or_else(|| client.default_download_dir.to_string_lossy().to_string());

    let mut initial_state = TransferState {
        hash: hash_or_ticket.clone(),
        name: "P2P Blob Transfer".into(),
        progress: 0.0,
        size: 0,
        speed: "Connecting...".into(),
        down_speed_bytes: 0,
        up_speed_bytes: 0,
        eta: "calculating...".into(),
        is_downloading: true,
        is_paused: false,
        peers: 1,
        output_folder: output_folder.clone(),
    };

    if let Ok(ticket) = BlobTicket::from_str(&hash_or_ticket) {
        let node_addr = ticket.addr().clone();
        let hash_and_format = ticket.hash_and_format();
        let hash = ticket.hash();
        let hash_str = hash.to_string();

        initial_state.hash = hash_str.clone();
        initial_state.name = format!("Iroh Blob {}", &hash_str[..8.min(hash_str.len())]);

        // Put initial transfer in state immediately
        {
            let mut guard = client.transfers.lock().unwrap();
            guard.retain(|x| x.hash != hash_str);
            guard.push(initial_state);
        }

        // Spawn non-blocking background task for Iroh stream
        let endpoint = client.endpoint.clone();
        let store = client.store.clone();
        let transfers = client.transfers.clone();

        tokio::spawn(async move {
            let start_instant = std::time::Instant::now();
            match endpoint.connect(node_addr, iroh_blobs::ALPN).await {
                Ok(connection) => {
                    let progress = store.remote().fetch(connection, hash_and_format);
                    let mut stream = progress.stream();

                    while let Some(item) = stream.next().await {
                        match item {
                            iroh_blobs::api::remote::GetProgressItem::Progress(bytes_downloaded) => {
                                let elapsed = start_instant.elapsed().as_secs_f64().max(0.1);
                                let bps = bytes_downloaded as f64 / elapsed;
                                let mut guard = transfers.lock().unwrap();
                                if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_str) {
                                    t.progress = if t.size > 0 {
                                        ((bytes_downloaded as f32 / t.size as f32) * 100.0).min(99.9)
                                    } else {
                                        50.0
                                    };
                                    t.down_speed_bytes = bps as u64;
                                    t.speed = format_speed(bps);
                                    if t.size > bytes_downloaded && bps > 1.0 {
                                        let rem_secs = ((t.size - bytes_downloaded) as f64 / bps) as u64;
                                        t.eta = format!("{}s", rem_secs);
                                    } else {
                                        t.eta = "soon".into();
                                    }
                                }
                            }
                            iroh_blobs::api::remote::GetProgressItem::Done(stats) => {
                                let mut guard = transfers.lock().unwrap();
                                if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_str) {
                                    t.progress = 100.0;
                                    t.is_downloading = false;
                                    t.down_speed_bytes = 0;
                                    t.speed = "0 KB/s".into();
                                    t.eta = "-".into();
                                    t.size = stats.payload_bytes_read;
                                }
                            }
                            iroh_blobs::api::remote::GetProgressItem::Error(_e) => {
                                let mut guard = transfers.lock().unwrap();
                                if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_str) {
                                    t.is_downloading = false;
                                    t.down_speed_bytes = 0;
                                    t.speed = "Failed".into();
                                    t.eta = "-".into();
                                }
                                break;
                            }
                        }
                    }
                }
                Err(_) => {
                    let mut guard = transfers.lock().unwrap();
                    if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_str) {
                        t.is_downloading = false;
                        t.down_speed_bytes = 0;
                        t.speed = "Connection Failed".into();
                        t.eta = "-".into();
                    }
                }
            }
        });
    } else {
        // Fallback / simulated blob transfer for bare hashes or demo tickets
        let name = if hash_or_ticket == "123" {
            "ubuntu-24.04-desktop-amd64.iso".to_string()
        } else if hash_or_ticket == "456" {
            "blender-4.1.0-windows-x64.zip".to_string()
        } else {
            let short = &hash_or_ticket[..12.min(hash_or_ticket.len())];
            format!("P2P Package ({})", short)
        };

        let size = if hash_or_ticket == "123" { 4_700_000_000 } else { 312_000_000 };
        initial_state.name = name;
        initial_state.size = size;

        {
            let mut guard = client.transfers.lock().unwrap();
            guard.retain(|x| x.hash != hash_or_ticket);
            guard.push(initial_state);
        }

        let transfers_clone = client.transfers.clone();
        let hash_or_ticket_clone = hash_or_ticket.clone();
        tokio::spawn(async move {
            for i in 1..=20 {
                tokio::time::sleep(std::time::Duration::from_millis(250)).await;
                let mut guard = transfers_clone.lock().unwrap();
                if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_or_ticket_clone) {
                    if t.is_paused {
                        continue;
                    }
                    t.progress = (i as f32) * 5.0;
                    t.down_speed_bytes = 12 * 1024 * 1024;
                    t.speed = "12.0 MB/s".into();
                    t.eta = format!("{}s", (20 - i) * 2);
                    t.peers = 12;
                    if i == 20 {
                        t.is_downloading = false;
                        t.down_speed_bytes = 0;
                        t.speed = "0 KB/s".into();
                        t.eta = "-".into();
                    }
                }
            }
        });
    }

    Ok(())
}
