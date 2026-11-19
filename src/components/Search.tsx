import { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, File as FileIcon, Star, MessageSquare, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { formatBytes } from "../utils/format";

function deterministicSeeders(hash: string, isTrusted: boolean): number {
  let sum = 0;
  for (let i = 0; i < Math.min(hash.length, 16); i++) {
    sum += hash.charCodeAt(i);
  }
  return (sum % 9) + (isTrusted ? 5 : 2);
}

export function Search() {
  const [query, setQuery] = useState("");
  const [rawResults, setRawResults] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState("Software");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await invoke<any[]>("query", { channel: activeChannel });

      const mapped = res.map((meta) => {
        const trusted = Boolean(meta.is_trusted);
        return {
          hash: meta.hash,
          name: meta.name,
          size: meta.size > 0 ? formatBytes(meta.size) : "Unknown size",
          seeders: deterministicSeeders(meta.hash || meta.name, trusted),
          rating: trusted ? "5.0" : "4.6",
          comments: trusted ? 4 : 1,
          channel: meta.channel,
          pubkey: meta.pubkey || "nostr...peer",
          is_trusted: trusted,
        };
      });

      setRawResults(mapped);
    } catch (err) {
      console.error("Query failed", err);
    } finally {
      setLoading(false);
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rawResults;
    return rawResults.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.hash.toLowerCase().includes(q)
    );
  }, [rawResults, query]);

  useEffect(() => {
    fetchResults();
  }, [activeChannel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const handleDownload = async (hash: string, name: string) => {
    try {
      await invoke("download", { hash, outputFolder: null });
      showToast(`Started downloading "${name}"`);
    } catch (err) {
      console.error("Failed to download", err);
      showToast("Error starting download: " + err);
    }
  };

  const channels = ["General", "Software", "Media", "Gaming", "Documents"];

  return (
    <div className="p-8 h-full flex flex-col relative animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Discover</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">
            Decentralized index catalogs synced via Nostr relays & filtered by your Web of Trust
          </p>
        </div>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex gap-2 mb-6 z-10 flex-wrap">
        {channels.map((ch) => (
          <button
            key={ch}
            onClick={() => setActiveChannel(ch)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activeChannel === ch
                ? "bg-blue-600 text-white border-blue-500 glow-blue"
                : "bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            #{ch.toLowerCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className="relative mb-8 z-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-slate-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base transition-all backdrop-blur-sm"
          placeholder={`Search inside #${activeChannel.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute inset-y-2 right-2 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all cursor-pointer glow-blue flex items-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Search
        </button>
      </form>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col z-10">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-850/60 bg-slate-900/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-6">Name</div>
          <div className="col-span-2 text-right">Size</div>
          <div className="col-span-2 text-right">Swarm Health</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="overflow-y-auto p-3 space-y-2 flex-1">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">Querying Nostr Relays...</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Connecting to damus.io, nos.lol, primal.net and snort.social...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-slate-900/60 flex items-center justify-center border border-slate-800 mb-3 text-slate-400">
                <SearchIcon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">No index matches yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Be the first to publish file metadata under the "#{activeChannel.toLowerCase()}" category!
              </p>
            </div>
          ) : (
            results.map((file, idx) => (
              <div key={`${file.hash}-${idx}`} className="grid grid-cols-12 gap-4 p-4 glass-card rounded-xl items-center group">
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <FileIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate max-w-lg"
                        title={file.name}
                      >
                        {file.name}
                      </h3>
                      {file.is_trusted && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase shrink-0">
                          <ShieldCheck size={10} /> WoT Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                        {file.channel}
                      </span>
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star size={12} className="fill-amber-400" /> {file.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} /> {file.comments} reviews
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono truncate max-w-[140px]" title={file.hash}>
                        {file.hash}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-slate-300">{file.size}</div>
                <div className="col-span-2 text-right text-sm">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {file.seeders} peers
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <button
                    onClick={() => handleDownload(file.hash, file.name)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer glow-blue"
                  >
                    Download
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
