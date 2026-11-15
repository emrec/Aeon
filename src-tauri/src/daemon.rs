use anyhow::Result;
use iroh::Endpoint;
use iroh_blobs::store::fs::FsStore;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use nostr_sdk::prelude::*;

#[derive(Clone)]
pub struct MockIrohClient {
    pub endpoint: Endpoint,
    pub store: FsStore,
    pub peer_count: u32,
    pub transfers: Arc<Mutex<Vec<crate::transfer::TransferState>>>,
    pub nostr: Client,
    pub torrent: crate::torrent::TorrentEngine,
    pub trust: Arc<Mutex<crate::trust::TrustStore>>,
    pub default_download_dir: PathBuf,
}

pub async fn start_memory_node(data_dir: PathBuf) -> Result<MockIrohClient> {
    let blobs_dir = data_dir.join("blobs");
    std::fs::create_dir_all(&blobs_dir)?;

    let store = FsStore::load(blobs_dir).await?;
    let endpoint = Endpoint::builder(iroh::endpoint::presets::N0).bind().await?;

    let blobs = iroh_blobs::BlobsProtocol::new(&store, None);
    let _router = iroh::protocol::Router::builder(endpoint.clone())
        .accept(iroh_blobs::ALPN, blobs)
        .spawn();

    let transfers = Arc::new(Mutex::new(Vec::new()));

    // Initialize BitTorrent Engine
    let downloads_dir = dirs::download_dir()
        .unwrap_or_else(|| data_dir.join("downloads"))
        .join("Aeon");
    let torrent = crate::torrent::TorrentEngine::new(downloads_dir.clone()).await?;

    // Initialize Persistent Web of Trust Store
    let trust = Arc::new(Mutex::new(crate::trust::TrustStore::load(&data_dir)));

    // Load or generate Nostr keys
    let keys_path = data_dir.join("nostr_keys.txt");
    let keys = if keys_path.exists() {
        let content = std::fs::read_to_string(&keys_path).unwrap_or_default().trim().to_string();
        Keys::parse(&content).unwrap_or_else(|_| {
            let k = Keys::generate();
            if let Ok(sk) = k.secret_key() {
                let _ = std::fs::write(&keys_path, sk.to_secret_hex());
            }
            k
        })
    } else {
        let k = Keys::generate();
        if let Ok(sk) = k.secret_key() {
            let _ = std::fs::write(&keys_path, sk.to_secret_hex());
        }
        k
    };

    // Configure Nostr client & connect in background so window startup never blocks
    let nostr = Client::new(&keys);
    let nostr_bg = nostr.clone();
    tokio::spawn(async move {
        let _ = nostr_bg.add_relay("wss://relay.damus.io").await;
        let _ = nostr_bg.add_relay("wss://nos.lol").await;
        let _ = nostr_bg.add_relay("wss://relay.snort.social").await;
        let _ = nostr_bg.add_relay("wss://relay.primal.net").await;
        nostr_bg.connect().await;
    });

    Ok(MockIrohClient {
        endpoint,
        store,
        peer_count: 14,
        transfers,
        nostr,
        torrent,
        trust,
        default_download_dir: downloads_dir,
    })
}
