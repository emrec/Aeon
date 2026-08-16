import { useState, useEffect } from "react";
import { X, ArrowDown, ArrowUp, Activity, FileText, MessageSquare, ShieldCheck, Copy, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export interface TransferItem {
  id: string;
  hash: string;
  name: string;
  progress: number;
  size: number;
  down_speed: string;
  up_speed: string;
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
}

export function BottomInspector({ transfer, onClose }: BottomInspectorProps) {
  const [activeTab, setActiveTab] = useState<"general" | "files" | "peers" | "community">("general");
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!transfer) return;

    if (transfer.is_torrent) {
      invoke("get_torrent_details", { id: transfer.id })
        .then((res: any) => {
          if (res) setDetails(res);
        })
        .catch(console.error);
    }
  }, [transfer]);

  if (!transfer) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(transfer.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="h-64 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex flex-col z-20 transition-all duration-200">
      {/* Header bar */}
      <div className="px-6 py-2.5 border-b border-slate-850/80 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${
              transfer.protocol === "BitTorrent" 
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}>
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
              Files ({details?.files?.length || 1})
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
              Community & WoT
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
                    <span className="text-slate-400 flex items-center gap-1"><ArrowDown size={13} className="text-emerald-400" /> Download</span>
                    <span className="font-mono font-bold text-slate-200">{transfer.down_speed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1"><ArrowUp size={13} className="text-blue-400" /> Upload</span>
                    <span className="font-mono font-bold text-slate-200">{transfer.up_speed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1"><Activity size={13} className="text-amber-400" /> ETA</span>
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
                    <span className="font-bold text-slate-200">{formatSize(transfer.size)}</span>
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
                <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${transfer.progress}%` }} />
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
                    <span className="text-[11px] text-slate-300 truncate block">~/Downloads/Aeon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase pb-2 border-b border-slate-800">
              <div className="col-span-8">File Name</div>
              <div className="col-span-2 text-right">Size</div>
              <div className="col-span-2 text-right">Priority</div>
            </div>
            <div className="space-y-1.5 mt-2 overflow-y-auto flex-1">
              {details?.files && details.files.length > 0 ? (
                details.files.map((file: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-xs py-1.5 px-2 hover:bg-slate-900/40 rounded-lg items-center text-slate-300">
                    <div className="col-span-8 flex items-center gap-2 truncate">
                      <FileText size={14} className="text-blue-400 shrink-0" />
                      <span className="truncate">{file.filename || file.name || `File ${idx + 1}`}</span>
                    </div>
                    <div className="col-span-2 text-right font-mono text-slate-400">{formatSize(file.len || file.size || 0)}</div>
                    <div className="col-span-2 text-right">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">Normal</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 text-xs py-2 px-2 hover:bg-slate-900/40 rounded-lg items-center text-slate-300">
                  <div className="col-span-8 flex items-center gap-2 truncate">
                    <FileText size={14} className="text-blue-400 shrink-0" />
                    <span className="truncate">{transfer.name}</span>
                  </div>
                  <div className="col-span-2 text-right font-mono text-slate-400">{formatSize(transfer.size)}</div>
                  <div className="col-span-2 text-right">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">Normal</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "peers" && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase pb-2 border-b border-slate-800">
              <div className="col-span-4">Peer Address</div>
              <div className="col-span-3">Client / Software</div>
              <div className="col-span-2 text-right">Down Speed</div>
              <div className="col-span-3 text-right">Flags / Status</div>
            </div>
            <div className="space-y-1.5 mt-2 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-12 py-1.5 px-2 hover:bg-slate-900/40 rounded-lg items-center text-slate-300 font-mono">
                <div className="col-span-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  185.190.141.22:6881
                </div>
                <div className="col-span-3 text-slate-400 font-sans">qBittorrent/4.6.3</div>
                <div className="col-span-2 text-right text-emerald-400 font-bold">{transfer.down_speed}</div>
                <div className="col-span-3 text-right text-[10px] text-slate-500 font-sans">
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">uTP</span> Encrypted
                </div>
              </div>
              <div className="grid grid-cols-12 py-1.5 px-2 hover:bg-slate-900/40 rounded-lg items-center text-slate-300 font-mono">
                <div className="col-span-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  94.23.14.88:51413
                </div>
                <div className="col-span-3 text-slate-400 font-sans">Transmission/4.0.5</div>
                <div className="col-span-2 text-right text-slate-400">120 KB/s</div>
                <div className="col-span-3 text-right text-[10px] text-slate-500 font-sans">
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">TCP</span> Seeder
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "community" && (
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-2 overflow-y-auto">
              <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-850 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                  AL
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">Alice (WoT Verified)</span>
                    <span className="text-[10px] text-slate-500 font-mono">npub1z3...92jf</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Verified SHA256 checksum against official release mirror. Fast seeding speeds on the swarm!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck size={16} />
                <span>Web of Trust Verification Score: 98% (High Reputation)</span>
              </div>
              <button className="px-3 py-1 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg transition-colors cursor-pointer text-xs font-semibold">
                Post Nostr Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
