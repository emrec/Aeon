use anyhow::Result;
use iroh::Endpoint;
use iroh_blobs::store::fs::FsStore;
use std::path::PathBuf;
use nostr_sdk::prelude::*;

#[derive(Clone)]
pub struct MockIrohClient {
    pub endpoint: Endpoint,
    pub store: FsStore,
    pub peer_count: u32,
    pub transfers: std::sync::Arc<std::sync::Mutex<Vec<crate::transfer::TransferState>>>,
    pub nostr: Client,
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

    let transfers = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));

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

    // Configure Nostr client
    let nostr = Client::new(&keys);
    nostr.add_relay("wss://relay.damus.io").await.ok();
    nostr.add_relay("wss://nos.lol").await.ok();
    nostr.add_relay("wss://relay.snort.social").await.ok();
    nostr.add_relay("wss://relay.primal.net").await.ok();
    nostr.connect().await;

    Ok(MockIrohClient {
        endpoint,
        store,
        peer_count: 12,
        transfers,
        nostr,
    })
}
