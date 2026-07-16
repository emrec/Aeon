use anyhow::Result;
use iroh::Endpoint;
use iroh_blobs::store::fs::FsStore;
use std::path::PathBuf;

#[derive(Clone)]
pub struct MockIrohClient {
    pub endpoint: Endpoint,
    pub store: FsStore,
    pub peer_count: u32,
    pub transfers: std::sync::Arc<std::sync::Mutex<Vec<crate::transfer::TransferState>>>,
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

    Ok(MockIrohClient {
        endpoint,
        store,
        peer_count: 12,
        transfers,
    })
}
