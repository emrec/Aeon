use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct MockIrohClient {
    // Mock state for the network
    pub peer_count: u32,
}

pub async fn start_memory_node() -> Result<MockIrohClient> {
    Ok(MockIrohClient { peer_count: 12 })
}
