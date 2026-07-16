use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub size: u64,
    pub hash: String, // Blob hash
    pub channel: String,
}

pub async fn publish_metadata(_client: &crate::daemon::MockIrohClient, meta: FileMetadata) -> Result<(), String> {
    // TODO: implement Iroh document sync insertion
    println!("Publishing: {:?}", meta);
    Ok(())
}

pub async fn query_metadata(_client: &crate::daemon::MockIrohClient, channel: &str) -> Result<Vec<FileMetadata>, String> {
    // TODO: implement Iroh document query
    Ok(vec![
        FileMetadata {
            name: "ubuntu-24.04-desktop-amd64.iso".into(),
            size: 4700000000,
            hash: "123".into(),
            channel: channel.into(),
        },
        FileMetadata {
            name: "blender-4.1.0-windows-x64.zip".into(),
            size: 312000000,
            hash: "456".into(),
            channel: channel.into(),
        }
    ])
}
