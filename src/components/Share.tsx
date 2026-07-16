import { useState, useEffect } from "react";
import { X, HardDrive, Inbox, FileUp, FolderUp, Copy, Check, Info, Trash2 } from "lucide-react";
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

export function Share() {
  const [shares, setShares] = useState<Transfer[]>([]);
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const fetchShares = async () => {
    try {
      const list = await invoke<Transfer[]>("get_transfers");
      // Only show files/folders that we shared (seeding/completed uploads, i.e., is_downloading is false)
      setShares(list.filter(t => !t.is_downloading));
    } catch (err) {
      console.error("Failed to fetch shared files:", err);
    }
  };

  useEffect(() => {
    fetchShares();
    const interval = setInterval(fetchShares, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1000;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleShareFile = async () => {
    setIsSharing(true);
    setErrorMsg(null);
    try {
      const ticket = await invoke<string>("share_file");
      setGeneratedTicket(ticket);
      fetchShares();
    } catch (err: any) {
      if (err !== "Selection cancelled") {
        setErrorMsg(err.toString());
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareFolder = async () => {
    setIsSharing(true);
    setErrorMsg(null);
    try {
      const ticket = await invoke<string>("share_folder");
      setGeneratedTicket(ticket);
      fetchShares();
    } catch (err: any) {
      if (err !== "Selection cancelled") {
        setErrorMsg(err.toString());
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (hash: string) => {
    try {
      await invoke("remove_transfer", { hash });
      fetchShares();
    } catch (err) {
      console.error("Failed to remove shared content:", err);
    }
  };

  const copyToClipboard = (text: string, hash: string | null = null) => {
    navigator.clipboard.writeText(text);
    if (hash) {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col relative animate-fade-in">
      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Share Content</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Publish files and directories to the global Iroh network</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 z-10">
        {/* Sharing Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleShareFile}
            disabled={isSharing}
            className="flex items-start gap-4 p-5 rounded-2xl text-left bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600/20 transition-all duration-200 shadow-lg shadow-blue-500/5">
              <FileUp size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">Share a File</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">Import any file into the Iroh persistent store and generate an index-sync ticket.</p>
            </div>
          </button>

          <button 
            onClick={handleShareFolder}
            disabled={isSharing}
            className="flex items-start gap-4 p-5 rounded-2xl text-left bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600/20 transition-all duration-200 shadow-lg shadow-indigo-500/5">
              <FolderUp size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">Share a Folder</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">Import a directory tree as an Iroh collection (HashSeq) to seed multiple files at once.</p>
            </div>
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-xs">
            <Info size={16} className="shrink-0" />
            <div>
              <p className="font-bold">Error sharing content</p>
              <p className="mt-0.5 text-red-300/80">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Modal / Display Card for newly generated ticket */}
        {generatedTicket && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border border-blue-500/20 shadow-xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <button 
              onClick={() => setGeneratedTicket(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">✓</div>
              <h3 className="font-bold text-slate-200 text-sm">Successfully Seeding & Synced!</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl mb-4 leading-relaxed">
              Your content has been added to Iroh. Share the ticket below with peers so they can connect and download the files directly.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={generatedTicket} 
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none select-all"
              />
              <button 
                onClick={() => copyToClipboard(generatedTicket)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer glow-blue"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Ticket"}
              </button>
            </div>
          </div>
        )}

        {/* Shared Files List */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Currently Shared & Seeding</h3>
          </div>
          
          {shares.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 glass-panel rounded-2xl border border-slate-800/40">
              <div className="w-12 h-12 rounded-full bg-slate-900/60 flex items-center justify-center border border-slate-800 mb-3 text-slate-400">
                <Inbox size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Not sharing anything yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Select a file or folder above to start sharing it with the P2P swarm.
              </p>
            </div>
          ) : (
            shares.map((s) => (
              <div key={s.hash} className="glass-card p-5 rounded-2xl shadow-lg border border-slate-800/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                    <FileUp size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-200 truncate max-w-md">{s.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#94a3b8] mt-1">
                      {s.size > 0 && <span className="flex items-center gap-1"><HardDrive size={14} /> {formatSize(s.size)}</span>}
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                        {s.peers} gossip peers
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono select-all truncate max-w-[150px]" title={s.hash}>Hash: {s.hash}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => copyToClipboard(s.hash, s.hash)}
                    title="Copy Hash"
                    className="p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  >
                    {copiedHash === s.hash ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                  <button 
                    onClick={() => handleRemoveShare(s.hash)}
                    title="Remove from Share"
                    className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
