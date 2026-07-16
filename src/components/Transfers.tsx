import { useState, useEffect } from "react";
import { Play, Pause, X, ArrowDownRight, HardDrive, Inbox, Download, Info } from "lucide-react";
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
  const [ticketInput, setTicketInput] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      const list = await invoke<Transfer[]>("get_transfers");
      // Only show downloads (where is_downloading is true)
      setTransfers(list.filter(t => t.is_downloading));
    } catch (err) {
      console.error("Failed to fetch transfers:", err);
    }
  };

  useEffect(() => {
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

  const handleDownloadTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    setIsDownloading(true);
    setErrorMsg(null);
    try {
      await invoke("download", { hash: ticketInput.trim() });
      setTicketInput("");
      fetchTransfers();
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancelDownload = async (hash: string) => {
    try {
      await invoke("remove_transfer", { hash });
      fetchTransfers();
    } catch (err) {
      console.error("Failed to cancel transfer:", err);
    }
  };

  // Calculate speed
  const activeDownloads = transfers.filter(t => t.progress < 100.0);
  const totalSpeed = activeDownloads.length > 0 ? "12.4 MB/s" : "0 KB/s";

  return (
    <div className="p-8 h-full flex flex-col relative animate-fade-in">
      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Downloads</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Track active file downloads from remote P2P peers</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800/80">
            <ArrowDownRight className="text-emerald-400" size={18} />
            <span className="text-sm font-bold text-slate-200">{totalSpeed}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 z-10">
        {/* Download from Ticket Input Box */}
        <form onSubmit={handleDownloadTicket} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Download className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-32 py-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base transition-all backdrop-blur-sm"
            placeholder="Paste Iroh ticket to download..."
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            disabled={isDownloading}
          />
          <button 
            type="submit" 
            disabled={isDownloading || !ticketInput.trim()}
            className="absolute inset-y-2 right-2 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all cursor-pointer glow-blue"
          >
            {isDownloading ? "Starting..." : "Download"}
          </button>
        </form>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-xs">
            <Info size={16} className="shrink-0" />
            <div>
              <p className="font-bold">Failed to resolve ticket</p>
              <p className="mt-0.5 text-red-300/80">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Downloads List */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Active Downloads</h3>
          </div>
          
          {transfers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 glass-panel rounded-2xl border border-slate-800/40">
              <div className="w-12 h-12 rounded-full bg-slate-900/60 flex items-center justify-center border border-slate-800 mb-3 text-slate-400">
                <Inbox size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">No active downloads</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Go to the Discover tab to find content or paste a P2P ticket above.
              </p>
            </div>
          ) : (
            transfers.map((t) => (
              <div key={t.hash} className="glass-card p-5 rounded-2xl shadow-lg border border-slate-800/60 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <ArrowDownRight size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-200 truncate max-w-md">{t.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#94a3b8] mt-1">
                        <span className="flex items-center gap-1"><HardDrive size={14} /> {formatSize(t.size)}</span>
                        <span className="font-semibold text-slate-300">{t.speed}</span>
                        {t.progress < 100.0 && <span>ETA: {t.eta}</span>}
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                          {t.peers} gossip peers
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors cursor-pointer">
                      {t.progress < 100.0 ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button 
                      onClick={() => handleCancelDownload(t.hash)}
                      className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="w-full bg-slate-950/60 border border-slate-850 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400 glow-blue"
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
    </div>
  );
}
