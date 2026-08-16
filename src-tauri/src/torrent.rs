use std::path::PathBuf;
use librqbit::{
    Api, Session, AddTorrent, AddTorrentOptions,
    api::{TorrentDetailsResponse, ApiTorrentListOpts, TorrentIdOrHash},
};
use bytes::Bytes;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedTorrent {
    pub id: usize,
    pub info_hash: String,
    pub name: String,
    pub progress: f64,
    pub total_bytes: u64,
    pub downloaded_bytes: u64,
    pub uploaded_bytes: u64,
    pub down_speed: String,
    pub up_speed: String,
    pub eta: String,
    pub seeds: usize,
    pub peers: usize,
    pub status: String,
    pub ratio: f64,
    pub protocol: String, // "BitTorrent"
}

#[derive(Clone)]
pub struct TorrentEngine {
    pub api: Api,
}

impl TorrentEngine {
    pub async fn new(download_dir: PathBuf) -> anyhow::Result<Self> {
        std::fs::create_dir_all(&download_dir)?;
        let session = Session::new(download_dir).await?;
        let api = Api::new(session, None);
        Ok(Self { api })
    }

    pub async fn add_magnet(&self, magnet: &str, output_folder: Option<String>) -> anyhow::Result<String> {
        let opts = AddTorrentOptions {
            overwrite: true,
            output_folder,
            ..Default::default()
        };
        let res = self.api.api_add_torrent(AddTorrent::from_url(magnet), Some(opts)).await
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        
        let id_str = res.id.map(|i| i.to_string()).unwrap_or_else(|| "0".to_string());
        Ok(id_str)
    }

    pub async fn add_torrent_bytes(&self, bytes: Vec<u8>, output_folder: Option<String>) -> anyhow::Result<String> {
        let opts = AddTorrentOptions {
            overwrite: true,
            output_folder,
            ..Default::default()
        };
        let res = self.api.api_add_torrent(AddTorrent::TorrentFileBytes(Bytes::from(bytes)), Some(opts)).await
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        
        let id_str = res.id.map(|i| i.to_string()).unwrap_or_else(|| "0".to_string());
        Ok(id_str)
    }

    pub async fn pause(&self, id_or_hash: &str) -> anyhow::Result<()> {
        let id = TorrentIdOrHash::parse(id_or_hash)?;
        self.api.api_torrent_action_pause(id).await
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        Ok(())
    }

    pub async fn resume(&self, id_or_hash: &str) -> anyhow::Result<()> {
        let id = TorrentIdOrHash::parse(id_or_hash)?;
        self.api.api_torrent_action_start(id).await
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        Ok(())
    }

    pub async fn delete(&self, id_or_hash: &str, delete_files: bool) -> anyhow::Result<()> {
        let id = TorrentIdOrHash::parse(id_or_hash)?;
        if delete_files {
            self.api.api_torrent_action_delete(id).await
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        } else {
            self.api.api_torrent_action_forget(id).await
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        }
        Ok(())
    }

    pub fn list_torrents(&self) -> Vec<NormalizedTorrent> {
        let list = self.api.api_torrent_list_ext(ApiTorrentListOpts { with_stats: true });
        list.torrents
            .into_iter()
            .map(|t| {
                let id = t.id.unwrap_or(0);
                let info_hash = t.info_hash;
                let name = t.name.unwrap_or_else(|| "Torrent Loading...".to_string());
                
                let mut progress = 0.0;
                let mut total_bytes = 0;
                let mut downloaded_bytes = 0;
                let mut uploaded_bytes = 0;
                let mut down_speed = "0 KB/s".to_string();
                let mut up_speed = "0 KB/s".to_string();
                let mut eta = "-".to_string();
                let mut seeds = 0;
                let mut peers = 0;
                let mut status = "Downloading".to_string();
                let mut ratio = 0.0;

                if let Some(stats) = t.stats {
                    total_bytes = stats.total_bytes;
                    downloaded_bytes = stats.progress_bytes;
                    uploaded_bytes = stats.uploaded_bytes;
                    
                    if total_bytes > 0 {
                        progress = (downloaded_bytes as f64 / total_bytes as f64) * 100.0;
                    }
                    if downloaded_bytes > 0 {
                        ratio = uploaded_bytes as f64 / downloaded_bytes as f64;
                    }

                    if stats.finished {
                        status = "Seeding".to_string();
                        progress = 100.0;
                    }

                    if let Some(live) = stats.live {
                        let ds = live.download_speed.mbps * 125.0; // convert to KB/s approx
                        if ds > 1024.0 {
                            down_speed = format!("{:.1} MB/s", ds / 1024.0);
                        } else {
                            down_speed = format!("{:.0} KB/s", ds);
                        }

                        let us = live.upload_speed.mbps * 125.0;
                        if us > 1024.0 {
                            up_speed = format!("{:.1} MB/s", us / 1024.0);
                        } else {
                            up_speed = format!("{:.0} KB/s", us);
                        }

                        peers = live.snapshot.peer_stats.live;
                        seeds = live.snapshot.peer_stats.live + live.snapshot.peer_stats.connecting;
                        
                        if let Some(time_left) = live.time_remaining {
                            eta = time_left.to_string();
                        }
                    }
                }

                NormalizedTorrent {
                    id,
                    info_hash,
                    name,
                    progress,
                    total_bytes,
                    downloaded_bytes,
                    uploaded_bytes,
                    down_speed,
                    up_speed,
                    eta,
                    seeds: seeds as usize,
                    peers: peers as usize,
                    status,
                    ratio,
                    protocol: "BitTorrent".to_string(),
                }
            })
            .collect()
    }

    pub fn get_details(&self, id_or_hash: &str) -> Option<TorrentDetailsResponse> {
        let id = TorrentIdOrHash::parse(id_or_hash).ok()?;
        self.api.api_torrent_details(id).ok()
    }

    pub fn get_media_files(&self, id_or_hash: &str) -> Vec<MediaFile> {
        let details = match self.get_details(id_or_hash) {
            Some(d) => d,
            None => return Vec::new(),
        };

        let files = match details.files {
            Some(f) => f,
            None => return Vec::new(),
        };

        files
            .into_iter()
            .enumerate()
            .map(|(idx, file)| {
                let name = file.name;
                let lower = name.to_lowercase();
                
                let is_video = lower.ends_with(".mp4") || lower.ends_with(".mkv") || lower.ends_with(".webm") || lower.ends_with(".avi") || lower.ends_with(".mov");
                let is_audio = lower.ends_with(".mp3") || lower.ends_with(".flac") || lower.ends_with(".wav") || lower.ends_with(".ogg") || lower.ends_with(".m4a");
                let is_subtitle = lower.ends_with(".srt") || lower.ends_with(".vtt") || lower.ends_with(".sub");

                let mime_type = if is_video {
                    if lower.ends_with(".webm") { "video/webm".to_string() } else { "video/mp4".to_string() }
                } else if is_audio {
                    if lower.ends_with(".mp3") { "audio/mp3".to_string() } else { "audio/ogg".to_string() }
                } else if is_subtitle {
                    "text/vtt".to_string()
                } else {
                    "application/octet-stream".to_string()
                };

                MediaFile {
                    file_index: idx,
                    name,
                    size: file.length,
                    is_video,
                    is_audio,
                    is_subtitle,
                    mime_type,
                }
            })
            .collect()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFile {
    pub file_index: usize,
    pub name: String,
    pub size: u64,
    pub is_video: bool,
    pub is_audio: bool,
    pub is_subtitle: bool,
    pub mime_type: String,
}

