use serde::{Deserialize, Serialize};
use std::str::FromStr;
use iroh_blobs::ticket::BlobTicket;
use futures::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferState {
    pub hash: String,
    pub name: String,
    pub progress: f32, // 0.0 to 100.0 (or 0.0 to 1.0)
    pub size: u64,
    pub speed: String,
    pub eta: String,
    pub is_downloading: bool,
    pub peers: u32,
}

pub async fn start_download(client: &crate::daemon::MockIrohClient, hash_or_ticket: String) -> Result<(), String> {
    let mut initial_state = TransferState {
        hash: hash_or_ticket.clone(),
        name: "Unknown P2P Blob".into(),
        progress: 0.0,
        size: 0,
        speed: "0 KB/s".into(),
        eta: "calculating...".into(),
        is_downloading: true,
        peers: 0,
    };

    if let Ok(ticket) = BlobTicket::from_str(&hash_or_ticket) {
        let node_addr = ticket.addr().clone();
        let hash_and_format = ticket.hash_and_format();
        let hash = ticket.hash();
        let hash_str = hash.to_string();

        initial_state.hash = hash_str.clone();
        initial_state.name = format!("Blob {}", &hash_str[..8]);

        // Put initial transfer in state
        {
            let mut guard = client.transfers.lock().unwrap();
            guard.push(initial_state.clone());
        }

        // 1. Connect to peer
        let connection = client.endpoint.connect(node_addr, iroh_blobs::ALPN).await
            .map_err(|e| format!("Failed to connect to peer: {}", e))?;

        // 2. Fetch the blob
        let progress = client.store.remote().fetch(connection, hash_and_format);
        let mut stream = progress.stream();

        // 3. Track progress and update state
        while let Some(item) = stream.next().await {
            match item {
                iroh_blobs::api::remote::GetProgressItem::Progress(bytes_downloaded) => {
                    // Update progress
                    let mut guard = client.transfers.lock().unwrap();
                    if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_str) {
                        t.progress = if t.size > 0 {
                            (bytes_downloaded as f32 / t.size as f32) * 100.0
                        } else {
                            50.0 // fallback if size unknown
                        };
                        t.speed = format!("{:.1} MB/s", 1.2); // mock transfer speed
                        t.eta = "1m".into();
                    }
                }
                iroh_blobs::api::remote::GetProgressItem::Done(stats) => {
                    let mut guard = client.transfers.lock().unwrap();
                    if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_str) {
                        t.progress = 100.0;
                        t.is_downloading = false;
                        t.speed = "0 KB/s".into();
                        t.eta = "-".into();
                        t.size = stats.payload_bytes_read;
                    }
                }
                iroh_blobs::api::remote::GetProgressItem::Error(e) => {
                    let mut guard = client.transfers.lock().unwrap();
                    if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_str) {
                        t.is_downloading = false;
                        t.speed = "Failed".into();
                        t.eta = "-".into();
                    }
                    return Err(format!("Download error: {}", e));
                }
            }
        }
    } else {
        // Mock download for UI previewing if it's a bare hash or mock string
        let name = if hash_or_ticket == "123" {
            "ubuntu-24.04-desktop-amd64.iso".to_string()
        } else if hash_or_ticket == "456" {
            "blender-4.1.0-windows-x64.zip".to_string()
        } else {
            format!("Mock Blob {}", hash_or_ticket)
        };

        let size = if hash_or_ticket == "123" { 4700000000 } else { 312000000 };
        initial_state.name = name.clone();
        initial_state.size = size;

        {
            let mut guard = client.transfers.lock().unwrap();
            // Remove if already exists so we can restart mock download
            guard.retain(|x| x.hash != hash_or_ticket);
            guard.push(initial_state.clone());
        }

        // Spawn mock progress update thread/task
        let transfers_clone = client.transfers.clone();
        let hash_or_ticket_clone = hash_or_ticket.clone();
        tokio::spawn(async move {
            for i in 1..=20 {
                tokio::time::sleep(std::time::Duration::from_millis(150)).await;
                let mut guard = transfers_clone.lock().unwrap();
                if let Some(t) = guard.iter_mut().find(|x| x.hash == hash_or_ticket_clone) {
                    t.progress = (i as f32) * 5.0;
                    t.speed = "12.4 MB/s".into();
                    t.eta = format!("{}s", (20 - i) * 2);
                    t.peers = 12;
                    if i == 20 {
                        t.is_downloading = false;
                        t.speed = "0 KB/s".into();
                        t.eta = "-".into();
                    }
                }
            }
        });
    }

    Ok(())
}
