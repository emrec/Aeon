use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rating {
    pub hash: String,
    pub rater_pubkey: String,
    pub score: i8, // -1 or 1
    pub comment: String,
    pub signature: String,
}

pub fn verify_signature(rating: &Rating) -> bool {
    // TODO: implement ed25519-dalek / iroh key verification
    true
}

pub fn is_trusted(pubkey: &str) -> bool {
    // TODO: Implement WoT local database lookup
    true
}
