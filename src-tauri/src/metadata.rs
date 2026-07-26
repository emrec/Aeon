use serde::{Deserialize, Serialize};
use nostr_sdk::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub size: u64,
    pub hash: String, // Blob hash / Ticket string
    pub channel: String,
}

pub async fn publish_metadata(client: &crate::daemon::MockIrohClient, meta: FileMetadata) -> Result<(), String> {
    let custom_tags = vec![
        Tag::custom(TagKind::from("url"), vec![meta.hash.clone()]), // In our case, the hash field passed from frontend is the iroh ticket string!
        Tag::custom(TagKind::from("m"), vec!["application/octet-stream".to_string()]),
        Tag::custom(TagKind::from("t"), vec![meta.channel.clone()]),
        Tag::custom(TagKind::from("size"), vec![meta.size.to_string()]),
        Tag::custom(TagKind::from("x"), vec!["0000000000000000000000000000000000000000000000000000000000000000".to_string()]), // dummy sha256 hash
    ];
    
    let event_builder = EventBuilder::new(Kind::from(1063), meta.name.clone(), custom_tags);
    client.nostr.send_event_builder(event_builder).await
        .map(|_| ())
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

pub async fn query_metadata(client: &crate::daemon::MockIrohClient, channel: &str) -> Result<Vec<FileMetadata>, String> {
    let filter = Filter::new()
        .kind(Kind::from(1063))
        .custom_tag(SingleLetterTag::lowercase(Alphabet::T), vec![channel.to_string()]);
    
    let timeout = std::time::Duration::from_secs(5);
    let events = client.nostr.get_events_of(vec![filter], EventSource::both(Some(timeout))).await
        .map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();
    for event in events {
        let mut name = event.content.clone();
        let mut size = 0;
        let mut hash = String::new();
        let mut found_url = false;
        
        for tag in event.tags.clone() {
            let v = tag.to_vec();
            if v.len() >= 2 {
                match v[0].as_str() {
                    "url" => {
                        hash = v[1].clone(); // In our case, hash is the ticket string! Let's map ticket string to hash parameter
                        found_url = true;
                    }
                    "size" => {
                        size = v[1].parse::<u64>().unwrap_or(0);
                    }
                    _ => {}
                }
            }
        }
        
        if name.is_empty() {
            name = "Unnamed file".to_string();
        }
        
        if found_url {
            results.push(FileMetadata {
                name,
                size,
                hash,
                channel: channel.to_string(),
            });
        }
    }
    
    Ok(results)
}
