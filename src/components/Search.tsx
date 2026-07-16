import { useState } from "react";
import { Search as SearchIcon, File as FileIcon, Star, MessageSquare } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await invoke<any[]>("query", { channel: "Software" });
      // The Rust backend returns FileMetadata struct. We'll map it to UI layout.
      const mapped = res.map(meta => ({
          hash: meta.hash,
          name: meta.name,
          size: (meta.size / 1000000).toFixed(1) + " MB",
          seeders: 5, // Mocked gossip swarm seeders count
          rating: 4.8, // Mocked rating verified by local WoT
          comments: 2,
          channel: meta.channel
      }));
      setResults(mapped);
    } catch (err) {
      console.error("Query failed", err);
    }
  };

  const handleDownload = async (hash: string) => {
      try {
          await invoke("download", { hash });
          alert("Download started for " + hash);
      } catch (err) {
          console.error("Failed to download", err);
      }
  };

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Discover</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Search and sync global index catalogs</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative mb-8 z-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-slate-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base transition-all backdrop-blur-sm"
          placeholder="Search for files, hashes, or channels..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="absolute inset-y-2 right-2 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all cursor-pointer glow-blue">
          Search
        </button>
      </form>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col z-10">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-850/60 bg-slate-900/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-6">Name</div>
          <div className="col-span-2 text-right">Size</div>
          <div className="col-span-2 text-right">Gossip Swarm</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        <div className="overflow-y-auto p-3 space-y-2 flex-1">
          {results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-slate-900/60 flex items-center justify-center border border-slate-800 mb-3 text-slate-400">
                <SearchIcon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">No index matches yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Enter a query above to fetch entries synced via Iroh Docs and verified by your Web of Trust.</p>
            </div>
          ) : (
            results.map((file) => (
              <div key={file.hash} className="grid grid-cols-12 gap-4 p-4 glass-card rounded-xl items-center group">
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <FileIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{file.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                      <span className="bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-800 text-[10px] uppercase font-bold text-slate-400">{file.channel}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-semibold"><Star size={12} className="fill-amber-400"/> {file.rating}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {file.comments} reviews</span>
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
                    onClick={() => handleDownload(file.hash)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer glow-blue"
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
