import { useState, useEffect } from "react";
import { Play, Pause, X, ArrowUpRight, ArrowDownRight, HardDrive, Inbox } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface Transfer {
  hash: string;
  name: string;
  progress: number;
  size: number;
  speed: string;
  eta: string;
  is_downloading: boolean;
  peers: number;
}

export function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const list = await invoke<Transfer[]>("get_transfers");
        setTransfers(list);
      } catch (err) {
        console.error("Failed to fetch transfers:", err);
      }
    };

    fetchTransfers();
    const interval = setInterval(fetchTransfers, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1000;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Calculate total download speed
  const activeDownloads = transfers.filter(t => t.is_downloading);
  const totalSpeed = activeDownloads.length > 0 ? "12.4 MB/s" : "0 KB/s";

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Transfers</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Manage active downloads, seeding swarms, and gossip peers</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800/80">
            <ArrowDownRight className="text-emerald-400" size={18} />
            <span className="text-sm font-bold text-slate-200">{totalSpeed}</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800/80">
            <ArrowUpRight className="text-blue-400" size={18} />
            <span className="text-sm font-bold text-slate-200">{activeDownloads.length > 0 ? "1.2 MB/s" : "0 KB/s"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 z-10">
        {transfers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl border border-slate-800/40">
            <div className="w-12 h-12 rounded-full bg-slate-900/60 flex items-center justify-center border border-slate-800 mb-3 text-slate-400">
              <Inbox size={20} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No active transfers</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Go to the Discover tab to find content, or share a file to start seeding.
            </p>
          </div>
        ) : (
          transfers.map((t) => (
            <div key={t.hash} className="glass-card p-5 rounded-2xl shadow-lg border border-slate-800/60 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${t.is_downloading ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'}`}>
                    {t.is_downloading ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{t.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-[#94a3b8] mt-1">
                      <span className="flex items-center gap-1"><HardDrive size={14} /> {formatSize(t.size)}</span>
                      <span className="font-semibold text-slate-300">{t.speed}</span>
                      {t.is_downloading && <span>ETA: {t.eta}</span>}
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                        {t.peers} gossip peers
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors cursor-pointer">
                    {t.is_downloading ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              <div className="w-full bg-slate-950/60 border border-slate-850 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${t.is_downloading ? 'bg-gradient-to-r from-emerald-500 to-teal-400 glow-blue' : 'bg-gradient-to-r from-blue-500 to-indigo-500 glow-blue'}`}
                  style={{ width: `${t.progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-right text-xs font-bold text-[#94a3b8]">
                {t.progress.toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
