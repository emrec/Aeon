import { useState } from "react";
import { X, Link2, Folder, DownloadCloud, FileCode2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface AddTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTransferModal({ isOpen, onClose, onSuccess }: AddTransferModalProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("Software");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMagnetOrTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const val = inputUrl.trim();
    try {
      if (val.startsWith("magnet:?") || (val.length === 40 && !val.includes("."))) {
        // BitTorrent magnet or 40-char infohash
        await invoke("add_torrent_magnet", { magnet: val, outputFolder: null });
      } else if (val.startsWith("blob:") || val.length > 50) {
        // Iroh blob ticket
        await invoke("download", { hash: val });
      } else {
        // General download fallback
        await invoke("download", { hash: val });
      }

      setInputUrl("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to add transfer:", err);
      setErrorMsg(err?.toString() || "Failed to start transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickTorrentFile = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await invoke("add_torrent_file", { outputFolder: null });
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err !== "Selection cancelled") {
        setErrorMsg(err?.toString() || "Failed to add .torrent file");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-lg p-6 rounded-2xl border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
            <DownloadCloud size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add Download or Torrent</h3>
            <p className="text-xs text-slate-400">Paste a Magnet URI, Iroh Ticket, or open a .torrent file</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAddMagnetOrTicket} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Magnet Link / Iroh Ticket
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="magnet:?xt=urn:btih:... or blob:..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
              />
              <Link2 size={16} className="absolute left-3 top-3.5 text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Channel / Category
              </label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Software">#software</option>
                <option value="Media">#media</option>
                <option value="Gaming">#gaming</option>
                <option value="Documents">#documents</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Save Directory
              </label>
              <div className="px-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2 truncate">
                <Folder size={14} className="text-blue-400 shrink-0" />
                <span className="truncate">Downloads/Aeon</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !inputUrl.trim()}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer glow-blue flex items-center justify-center gap-2"
            >
              <DownloadCloud size={16} />
              {isSubmitting ? "Starting..." : "Start Download"}
            </button>

            <button
              type="button"
              onClick={handlePickTorrentFile}
              disabled={isSubmitting}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <FileCode2 size={16} className="text-amber-400" />
              Open .torrent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
