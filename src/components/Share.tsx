import { useState, useEffect } from "react";
import { X, HardDrive, Inbox, FileUp, FolderUp, Copy, Check, Info, Trash2, Globe } from "lucide-react";
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
  const [newShareName, setNewShareName] = useState<string>("");
  const [newShareSize, setNewShareSize] = useState<number>(0);
  
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  // Nostr publish states
  const [publishChannel, setPublishChannel] = useState("Software");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const fetchShares = async () => {
    try {
      const list = await invoke<Transfer[]>("get_transfers");
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
    setPublishSuccess(false);
    try {
      // Pick file natively, import to store, and return ticket
      // In lib.rs, we modified it to return the ticket string.
      // Wait, let's get the file details too.
      // Since share_file does the selection internally, we can obtain name and size from the returned ticket/transfer list.
      const ticket = await invoke<string>("share_file");
      setGeneratedTicket(ticket);
      
      // Query transfers to get the newly added file details for Nostr publishing
      setTimeout(async () => {
        try {
          const list = await invoke<Transfer[]>("get_transfers");
          const sharedList = list.filter(t => !t.is_downloading);
          if (sharedList.length > 0) {
            const newest = sharedList[sharedList.length - 1];
            setNewShareName(newest.name);
            setNewShareSize(newest.size);
          }
        } catch (e) {
          console.error(e);
        }
      }, 500);

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
    setPublishSuccess(false);
    try {
      const ticket = await invoke<string>("share_folder");
      setGeneratedTicket(ticket);

      setTimeout(async () => {
        try {
          const list = await invoke<Transfer[]>("get_transfers");
          const sharedList = list.filter(t => !t.is_downloading);
          if (sharedList.length > 0) {
            const newest = sharedList[sharedList.length - 1];
            setNewShareName(newest.name);
            setNewShareSize(newest.size);
          }
        } catch (e) {
          console.error(e);
        }
      }, 500);

      fetchShares();
    } catch (err: any) {
      if (err !== "Selection cancelled") {
        setErrorMsg(err.toString());
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handlePublishToNostr = async () => {
    if (!generatedTicket) return;
    setIsPublishing(true);
    setPublishSuccess(false);
    try {
      await invoke("publish", {
        name: newShareName || "Shared Archive",
        size: newShareSize || 0,
        hash: generatedTicket, // Pass the ticket so peers download from it directly
        channel: publishChannel,
      });
      setPublishSuccess(true);
    } catch (err) {
      console.error("Nostr publish failed", err);
      setErrorMsg("Failed to publish to Nostr relays: " + err);
    } finally {
      setIsPublishing(false);
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
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 text-xs animate-pulse-slow">
            <Info size={16} className="shrink-0" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="mt-0.5 text-red-300/80">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Modal / Display Card for newly generated ticket & Nostr Index publishing */}
        {generatedTicket && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border border-blue-500/20 shadow-xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <button 
              onClick={() => setGeneratedTicket(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">✓</div>
              <h3 className="font-bold text-slate-200 text-sm">Successfully Seeding & Synced!</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl mb-4 leading-relaxed">
              Your content has been added to Iroh. Copy the ticket or publish it instantly to the Nostr catalog to make it globally discoverable.
            </p>
            
            {/* Copy ticket bar */}
            <div className="flex gap-2 mb-6">
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

            {/* Nostr Publishing panel */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Globe className="text-blue-400 animate-pulse-slow" size={20} />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Decentralized Search Catalog</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Publish NIP-94 File Metadata event to public Nostr relays</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-center w-full md:w-auto shrink-0">
                <select 
                  value={publishChannel}
                  onChange={(e) => setPublishChannel(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="Software">Software</option>
                  <option value="Media">Media</option>
                  <option value="Documents">Documents</option>
                </select>
                
                <button
                  onClick={handlePublishToNostr}
                  disabled={isPublishing || publishSuccess}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    publishSuccess ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20" :
                    "bg-blue-600 hover:bg-blue-500 text-white glow-blue"
                  }`}
                >
                  {isPublishing ? "Publishing..." : publishSuccess ? "✓ Published!" : "Publish to Nostr"}
                </button>
              </div>
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
