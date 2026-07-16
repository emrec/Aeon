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
          seeders: 0, // Mocked for now until we have tracker data
          rating: 0.0,
          comments: 0,
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
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Discover</h2>
          <p className="text-gray-500 mt-1">Search the global Iroh network</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg transition-shadow"
          placeholder="Search for files, hashes, or channels..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="absolute inset-y-2 right-2 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
          Search
        </button>
      </form>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-2 text-right">Size</div>
          <div className="col-span-2 text-right">Health</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        <div className="overflow-y-auto p-2">
          {results.map((file) => (
            <div key={file.hash} className="grid grid-cols-12 gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors items-center group">
              <div className="col-span-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{file.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{file.channel}</span>
                    <span className="flex items-center gap-1 text-amber-500 font-medium"><Star size={12} className="fill-amber-500"/> {file.rating}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {file.comments}</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-right text-sm font-medium text-gray-700">{file.size}</div>
              <div className="col-span-2 text-right text-sm">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {file.seeders} seeders
                </span>
              </div>
              <div className="col-span-2 text-right">
                <button 
                  onClick={() => handleDownload(file.hash)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
