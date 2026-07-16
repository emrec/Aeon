use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferState {
    pub hash: String,
    pub progress: f32, // 0.0 to 1.0
    pub is_downloading: bool,
}

pub async fn start_download(hash: String) -> Result<(), String> {
    // TODO: use iroh node blob client to download hash
    Ok(())
}
