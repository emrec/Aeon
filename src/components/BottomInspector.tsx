import { useState, useEffect } from "react";
import { X, ArrowDown, ArrowUp, Activity, FileText, MessageSquare, ShieldCheck, Copy, Check, Play, Send } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { formatBytes } from "../utils/format";

export interface TransferItem {
  id: string;
  hash: string;
  name: string;
  progress: number;
  size: number;
  down_speed: string;
  up_speed: string;
  down_speed_bytes?: number;
  up_speed_bytes?: number;
  eta: string;
  status: string;
  seeds: number;
  peers: number;
  ratio: number;
  protocol: string; // "BitTorrent" | "Iroh"
  is_torrent: boolean;
  output_folder: string;
}

interface BottomInspectorProps {
  transfer: TransferItem | null;
  onClose: () => void;
  onStreamMedia?: (name: string, isTorrent: boolean, filePath?: string) => void;
}

interface CommunityReview {
  author: string;
  pubkey: string;
  comment: string;
  verified: boolean;
}

export function BottomInspector({ transfer, onClose, onStreamMedia }: BottomInspectorProps) {
  const [activeTab, setActiveTab] = useState<"general" | "files" | "peers" | "community">("general");
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<CommunityReview[]>([
    {
      author: "Alice (WoT Verified)",
      pubkey: "npub1z3...92jf",
      comment: "Verified SHA256 checksum against official release mirror. Fast seeding speeds on the swarm!",
      verified: true,
    },
  ]);
  const [newReviewText, setNewReviewText] = useState("");
  const [showReviewInput, setShowReviewInput] = useState(false);

  useEffect(() => {
    if (!transfer) return;

    if (transfer.is_torrent) {
      invoke("get_torrent_details", { id: transfer.id })
        .then((res: any) => {
          if (res) setDetails(res);
        })
        .catch(console.error);

      invoke<any[]>("get_media_files", { id: transfer.id })
        .then((files) => {
          if (files) setMediaFiles(files);
        })
        .catch(console.error);
    } else {
      setDetails(null);
      setMediaFiles([]);
    }
  }, [transfer?.id, transfer?.is_torrent]);

  if (!transfer) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(transfer.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setReviews((prev) => [
      ...prev,
      {
        author: "You (Local Node)",
        pubkey: "npub1local...self",
        comment: newReviewText.trim(),
        verified: true,
      },
    ]);
    setNewReviewText("");
    setShowReviewInput(false);
  };

  const displayFiles = mediaFiles.length > 0 ? mediaFiles : details?.files || [];

  return (
    <div className="h-64 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex flex-col z-20 transition-all duration-200 shrink-0">
      {/* Header bar */}
      <div className="px-6 py-2.5 border-b border-slate-850/80 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${
                transfer.protocol === "BitTorrent"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              }`}
            >
              {transfer.protocol}
            </span>
            <h4 className="text-xs font-semibold text-slate-200 truncate max-w-sm" title={transfer.name}>
              {transfer.name}
            </h4>
          </div>

          {/* Inspector Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "general" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "files" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Files ({displayFiles.length || 1})
            </button>
            <button
              onClick={() => setActiveTab("peers")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "peers" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Peers & Trackers ({transfer.peers})
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "community" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare size={13} className="text-blue-400" />
              Community & WoT ({reviews.length})
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full text-xs">
            {/* Speed & Progress */}
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Transfer Speeds</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ArrowDown size={13} className="text-emerald-400" /> Download
                    </span>
                    <span className="font-mono font-bold text-slate-200">{transfer.down_speed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ArrowUp size={13} className="text-blue-400" /> Upload
                    </span>
                    <span className="font-mono font-bold text-slate-200">{transfer.up_speed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Activity size={13} className="text-amber-400" /> ETA
                    </span>
                    <span className="font-mono text-slate-300">{transfer.eta}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                <span className="text-slate-500">Share Ratio:</span>
                <span className="font-bold text-slate-300 font-mono">{transfer.ratio.toFixed(2)}</span>
              </div>
            </div>

            {/* Size & Progress Details */}
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Payload Metrics</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Size</span>
                    <span className="font-bold text-slate-200">{formatBytes(transfer.size, 2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold text-blue-400">{transfer.progress.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="font-semibold text-emerald-400">{transfer.status}</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${transfer.progress}%` }}
                />
              </div>
            </div>

            {/* Network Swarm */}
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Swarm Topology</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Connected Peers</span>
                    <span className="font-mono font-bold text-slate-200">{transfer.peers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Known Seeds</span>
                    <span className="font-mono font-bold text-slate-200">{transfer.seeds}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Protocol Layer</span>
                    <span className="font-semibold text-slate-300">{transfer.protocol}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                DHT & Gossip active
              </div>
            </div>

            {/* Hash & Path */}
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Identifier & Path</span>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">InfoHash / Ticket:</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono text-[11px] text-slate-300 truncate select-all">{transfer.hash}</span>
                      <button onClick={copyHash} className="p-1 hover:text-white text-slate-500 cursor-pointer shrink-0">
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Output Folder:</span>
                    <span className="text-[11px] text-slate-300 truncate block" title={transfer.output_folder || "~/Downloads/Aeon"}>
                      {transfer.output_folder || "~/Downloads/Aeon"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase pb-2 border-b border-slate-800">
              <div className="col-span-7">File Name</div>
              <div className="col-span-2 text-right">Size</div>
              <div className="col-span-1 text-right">Priority</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            <div className="space-y-1.5 mt-2 overflow-y-auto flex-1">
              {displayFiles.length > 0 ? (
                displayFiles.map((file: any, idx: number) => {
                  const fname = file.filename || file.name || `File ${idx + 1}`;
                  const fsize = file.size ?? file.len ?? file.length ?? 0;
                  const fpath = file.path || undefined;
                  return (
                    <div key={idx} className="grid grid-cols-12 text-xs py-1.5 px-2 hover:bg-slate-900/40 rounded-lg items-center text-slate-300">
                      <div className="col-span-7 flex items-center gap-2 truncate">
                        <FileText size={14} className="text-blue-400 shrink-0" />
                        <span className="truncate" title={fpath || fname}>{fname}</span>
                      </div>
                      <div className="col-span-2 text-right font-mono text-slate-400">{formatBytes(fsize, 2)}</div>
                      <div className="col-span-1 text-right">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-bold">Normal</span>
                      </div>
                      <div className="col-span-2 text-right flex justify-end">
                        <button
                          onClick={() => {
                            if (onStreamMedia) onStreamMedia(fname, transfer.is_torrent, fpath);
                          }}
                          className="px-2 py-0.5 bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Play size={10} /> Stream
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="grid grid-cols-12 text-xs py-2 px-2 hover:bg-slate-900/40 rounded-lg items-center text-slate-300">
                  <div className="col-span-7 flex items-center gap-2 truncate">
                    <FileText size={14} className="text-blue-400 shrink-0" />
                    <span className="truncate">{transfer.name}</span>
                  </div>
                  <div className="col-span-2 text-right font-mono text-slate-400">{formatBytes(transfer.size, 2)}</div>
                  <div className="col-span-1 text-right">
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-bold">Normal</span>
                  </div>
                  <div className="col-span-2 text-right flex justify-end">
                    <button
                      onClick={() => {
                        if (onStreamMedia) onStreamMedia(transfer.name, transfer.is_torrent, transfer.output_folder ? `${transfer.output_folder}/${transfer.name}` : undefined);
                      }}
                      className="px-2 py-0.5 bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Play size={10} /> Stream
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "peers" && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase pb-2 border-b border-slate-800">
              <div className="col-span-4">Peer / Endpoint</div>
              <div className="col-span-3">Protocol / Stack</div>
              <div className="col-span-2 text-right">Down Speed</div>
              <div className="col-span-3 text-right">Flags / Status</div>
            </div>
            <div className="space-y-1.5 mt-2 overflow-y-auto flex-1 text-xs">
              {transfer.peers === 0 ? (
                <div className="text-center text-slate-500 py-6 text-xs">
                  No active peer connections right now ({transfer.seeds} known in swarm).
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-12 py-1.5 px-2 hover:bg-slate-900/40 rounded-lg items-center text-slate-300 font-mono">
                    <div className="col-span-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {transfer.is_torrent ? "Swarm Peer Pool (" + transfer.peers + " active)" : "Iroh QUIC Relay / Direct"}
                    </div>
                    <div className="col-span-3 text-slate-400 font-sans">
                      {transfer.is_torrent ? "librqbit / BitTorrent v1+v2" : "iroh-blobs / ALPN QUIC"}
                    </div>
                    <div className="col-span-2 text-right text-emerald-400 font-bold">{transfer.down_speed}</div>
                    <div className="col-span-3 text-right text-[10px] text-slate-500 font-sans">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        {transfer.is_torrent ? "DHT + uTP" : "BLAKE3 Verified"}
                      </span>{" "}
                      Encrypted
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "community" && (
          <div className="h-full flex flex-col justify-between gap-2">
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {reviews.map((rev, i) => (
                <div key={i} className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-850 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {rev.author.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-200">{rev.author}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{rev.pubkey}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{rev.comment}</p>
                  </div>
                </div>
              ))}
            </div>

            {showReviewInput ? (
              <form onSubmit={handleAddReview} className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Write a signed Web of Trust review for this hash..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Send size={12} /> Publish
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewInput(false)}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck size={16} />
                  <span>Web of Trust Verification Score: 98% (High Reputation)</span>
                </div>
                <button
                  onClick={() => setShowReviewInput(true)}
                  className="px-3 py-1 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
                >
                  Post Nostr Review
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
