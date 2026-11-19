use serde::{Deserialize, Serialize};
use nostr_sdk::prelude::*;
use std::str::FromStr;
use iroh_blobs::ticket::BlobTicket;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub size: u64,
    pub hash: String, // Magnet link or Iroh Ticket string
    pub channel: String,
    #[serde(default)]
    pub pubkey: String,
    #[serde(default)]
    pub created_at: u64,
    #[serde(default)]
    pub is_trusted: bool,
}

fn extract_content_hash(ticket_or_magnet: &str) -> String {
    if let Ok(ticket) = BlobTicket::from_str(ticket_or_magnet) {
        return ticket.hash().to_string();
    }
    if let Some(pos) = ticket_or_magnet.find("btih:") {
        let rest = &ticket_or_magnet[pos + 5..];
        let hash_part = rest.split('&').next().unwrap_or(rest);
        if !hash_part.is_empty() {
            return hash_part.to_lowercase();
        }
    }
    ticket_or_magnet.to_string()
}

pub async fn publish_metadata(client: &crate::daemon::MockIrohClient, meta: FileMetadata) -> Result<(), String> {
    let content_hash = extract_content_hash(&meta.hash);
    let custom_tags = vec![
        Tag::custom(TagKind::from("url"), vec![meta.hash.clone()]),
        Tag::custom(TagKind::from("m"), vec!["application/octet-stream".to_string()]),
        Tag::custom(TagKind::from("t"), vec![meta.channel.to_lowercase()]),
        Tag::custom(TagKind::from("t"), vec![meta.channel.clone()]),
        Tag::custom(TagKind::from("size"), vec![meta.size.to_string()]),
        Tag::custom(TagKind::from("x"), vec![content_hash]),
    ];

    let event_builder = EventBuilder::new(Kind::from(1063), meta.name.clone(), custom_tags);
    client
        .nostr
        .send_event_builder(event_builder)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn query_metadata(client: &crate::daemon::MockIrohClient, channel: &str) -> Result<Vec<FileMetadata>, String> {
    let filter = Filter::new()
        .kind(Kind::from(1063))
        .custom_tag(
            SingleLetterTag::lowercase(Alphabet::T),
            vec![channel.to_string(), channel.to_lowercase()],
        )
        .limit(50);

    let timeout = std::time::Duration::from_secs(4);
    let events = client
        .nostr
        .get_events_of(vec![filter], EventSource::both(Some(timeout)))
        .await
        .unwrap_or_default();

    let trust_guard = client.trust.lock().unwrap_or_else(|e| e.into_inner());
    let mut results = Vec::new();
    let mut seen_hashes = std::collections::HashSet::new();

    for event in events {
        let pubkey_hex = event.pubkey.to_hex();
        if trust_guard.is_blocked(&pubkey_hex) {
            continue;
        }
        let is_trusted = trust_guard.is_trusted(&pubkey_hex);

        let mut name = event.content.clone();
        let mut size = 0;
        let mut hash = String::new();
        let mut found_url = false;

        for tag in event.tags.iter() {
            let v = tag.as_vec();
            if v.len() >= 2 {
                match v[0].as_str() {
                    "url" | "x" => {
                        if !found_url || v[0] == "url" {
                            hash = v[1].clone();
                            found_url = true;
                        }
                    }
                    "size" => {
                        size = v[1].parse::<u64>().unwrap_or(0);
                    }
                    _ => {}
                }
            }
        }

        if name.is_empty() {
            name = "Unnamed Shared Resource".to_string();
        }

        if found_url && seen_hashes.insert(hash.clone()) {
            let short_pk = if pubkey_hex.len() > 10 {
                format!("{}...{}", &pubkey_hex[..5], &pubkey_hex[pubkey_hex.len() - 4..])
            } else {
                pubkey_hex
            };
            results.push(FileMetadata {
                name,
                size,
                hash,
                channel: channel.to_string(),
                pubkey: short_pk,
                created_at: event.created_at.as_u64(),
                is_trusted,
            });
        }
    }

    results.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(results)
}
