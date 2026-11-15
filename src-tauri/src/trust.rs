use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustNode {
    pub pubkey: String,
    pub alias: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub added: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustData {
    pub trusted_nodes: Vec<TrustNode>,
    pub blocked_nodes: Vec<TrustNode>,
    pub auto_filtered_count: usize,
}

impl Default for TrustData {
    fn default() -> Self {
        Self {
            trusted_nodes: vec![
                TrustNode {
                    pubkey: "z3xk...92jf".into(),
                    alias: "IrohFoundation".into(),
                    node_type: "bootstrap".into(),
                    added: "Built-in".into(),
                    reason: None,
                },
                TrustNode {
                    pubkey: "x9as...11pz".into(),
                    alias: "LinuxISOs".into(),
                    node_type: "curated".into(),
                    added: "Built-in".into(),
                    reason: None,
                },
                TrustNode {
                    pubkey: "b88x...m39a".into(),
                    alias: "Alice".into(),
                    node_type: "friend".into(),
                    added: "Built-in".into(),
                    reason: None,
                },
            ],
            blocked_nodes: vec![
                TrustNode {
                    pubkey: "sp9x...k22p".into(),
                    alias: "SpamBot_99".into(),
                    node_type: "blocked".into(),
                    added: "Built-in".into(),
                    reason: Some("Flooding index with empty files".into()),
                },
                TrustNode {
                    pubkey: "ad12...88zz".into(),
                    alias: "AdNetwork_Direct".into(),
                    node_type: "blocked".into(),
                    added: "Built-in".into(),
                    reason: Some("Spamming commercial links in Software channel".into()),
                },
                TrustNode {
                    pubkey: "fake...u77x".into(),
                    alias: "FakeUbuntuSeed".into(),
                    node_type: "blocked".into(),
                    added: "Built-in".into(),
                    reason: Some("Providing corrupt payload for ISO downloads".into()),
                },
            ],
            auto_filtered_count: 11,
        }
    }
}

pub struct TrustStore {
    path: PathBuf,
    pub data: TrustData,
}

impl TrustStore {
    pub fn load(data_dir: &PathBuf) -> Self {
        let path = data_dir.join("trust_store.json");
        let data = if path.exists() {
            std::fs::read_to_string(&path)
                .ok()
                .and_then(|s| serde_json::from_str::<TrustData>(&s).ok())
                .unwrap_or_default()
        } else {
            let default_data = TrustData::default();
            if let Ok(json) = serde_json::to_string_pretty(&default_data) {
                let _ = std::fs::write(&path, json);
            }
            default_data
        };
        Self { path, data }
    }

    pub fn save(&self) {
        if let Ok(json) = serde_json::to_string_pretty(&self.data) {
            let _ = std::fs::write(&self.path, json);
        }
    }

    pub fn add_trusted(&mut self, alias: String, pubkey: String, node_type: String) -> TrustData {
        self.data.trusted_nodes.retain(|n| n.pubkey != pubkey);
        self.data.blocked_nodes.retain(|n| n.pubkey != pubkey);
        self.data.trusted_nodes.push(TrustNode {
            pubkey,
            alias,
            node_type,
            added: "Just now".into(),
            reason: None,
        });
        self.save();
        self.data.clone()
    }

    pub fn remove_trusted(&mut self, pubkey: &str) -> TrustData {
        self.data.trusted_nodes.retain(|n| n.pubkey != pubkey);
        self.save();
        self.data.clone()
    }

    pub fn block_node(&mut self, pubkey: String, alias: String, reason: Option<String>) -> TrustData {
        self.data.trusted_nodes.retain(|n| n.pubkey != pubkey);
        self.data.blocked_nodes.retain(|n| n.pubkey != pubkey);
        self.data.blocked_nodes.push(TrustNode {
            pubkey,
            alias,
            node_type: "blocked".into(),
            added: "Just now".into(),
            reason: Some(reason.unwrap_or_else(|| "Manually blocked by user".into())),
        });
        self.save();
        self.data.clone()
    }

    pub fn unblock_node(&mut self, pubkey: &str) -> TrustData {
        if let Some(pos) = self.data.blocked_nodes.iter().position(|n| n.pubkey == pubkey) {
            let removed = self.data.blocked_nodes.remove(pos);
            self.data.trusted_nodes.push(TrustNode {
                pubkey: removed.pubkey,
                alias: removed.alias,
                node_type: "friend".into(),
                added: "Just now".into(),
                reason: None,
            });
            self.save();
        }
        self.data.clone()
    }

    pub fn is_blocked(&self, pubkey: &str) -> bool {
        self.data
            .blocked_nodes
            .iter()
            .any(|n| pubkey.contains(&n.pubkey) || n.pubkey.contains(pubkey))
    }

    pub fn is_trusted(&self, pubkey: &str) -> bool {
        self.data
            .trusted_nodes
            .iter()
            .any(|n| pubkey.contains(&n.pubkey) || n.pubkey.contains(pubkey))
    }
}
