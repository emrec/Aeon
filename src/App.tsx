import { useState, useEffect, useMemo } from "react";
import "./App.css";
import { Search } from "./components/Search";
import { Share } from "./components/Share";
import { TrustManager } from "./components/TrustManager";
import { TransfersView } from "./components/TransfersView";
import { BottomInspector, TransferItem } from "./components/BottomInspector";
import { ChannelFeedView } from "./components/ChannelFeedView";
import { AddTransferModal } from "./components/AddTransferModal";
import { MediaPlayer, MediaStreamSource } from "./components/MediaPlayer";
import {
  Search as SearchIcon,
  ShieldCheck,
  Share2,
  Plus,
  Hash,
  HardDrive,
  Layers,
  ArrowDown,
  ArrowUp,
  FileCode2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [activeView, setActiveView] = useState("transfers-all");
  const [peerCount, setPeerCount] = useState(14);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaStreamSource | null>(null);

  // Poll transfers and peer count
  const fetchTransfers = async () => {
    try {
      const data = await invoke<TransferItem[]>("get_all_transfers");
      setTransfers(data);
      // Auto-update selected transfer if active
      if (selectedTransfer) {
        const updated = data.find((t) => t.id === selectedTransfer.id);
        if (updated) setSelectedTransfer(updated);
      }
    } catch (err) {
      // Fallback for development / mock preview
      if (transfers.length === 0) {
        setTransfers([
          {
            id: "1",
            hash: "magnet:?xt=urn:btih:2d8144b7880597b6e6d3dfd63a9a9efae3f533d3",
            name: "ubuntu-24.04-desktop-amd64.iso",
            progress: 74.2,
            size: 5046586368,
            down_speed: "3.4 MB/s",
            up_speed: "420 KB/s",
            eta: "4m 12s",
            status: "Downloading",
            seeds: 48,
            peers: 19,
            ratio: 0.35,
            protocol: "BitTorrent",
            is_torrent: true,
            output_folder: "Downloads/Aeon",
          },
          {
            id: "2",
            hash: "blob:ae73b881ef129994cba81",
            name: "decentralized_knowledge_base.tar.zst",
            progress: 100.0,
            size: 891289600,
            down_speed: "0 KB/s",
            up_speed: "1.1 MB/s",
            eta: "-",
            status: "Seeding",
            seeds: 12,
            peers: 5,
            ratio: 2.4,
            protocol: "Iroh",
            is_torrent: false,
            output_folder: "Downloads/Aeon",
          },
        ]);
      }
    }
  };

  useEffect(() => {
    fetchTransfers();
    const interval = setInterval(fetchTransfers, 1200);
    return () => clearInterval(interval);
  }, [selectedTransfer]);

  useEffect(() => {
    const fetchPeerCount = async () => {
      try {
        const count = await invoke<number>("get_gossip_peers");
        setPeerCount(count);
      } catch {
        // Mock fallback
      }
    };
    fetchPeerCount();
    const interval = setInterval(fetchPeerCount, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compute aggregate counts and speeds
  const counts = useMemo(() => {
    return {
      all: transfers.length,
      downloading: transfers.filter((t) => t.status.toLowerCase().includes("down")).length,
      seeding: transfers.filter((t) => t.status.toLowerCase().includes("seed") || t.progress >= 100).length,
      completed: transfers.filter((t) => t.progress >= 100).length,
      paused: transfers.filter((t) => t.status.toLowerCase().includes("pause")).length,
    };
  }, [transfers]);

  const handlePickTorrent = async () => {
    try {
      await invoke("add_torrent_file", { outputFolder: null });
      fetchTransfers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-[#f8fafc] overflow-hidden font-sans select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* Left Navigation Sidebar */}
      <aside className="w-64 glass-panel flex flex-col z-10 border-r border-[#1e293b]/50 shrink-0">
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e293b]/50">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 glow-blue shrink-0">
            <span className="text-white font-black text-lg leading-none">A</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent truncate">
              AEON
            </h1>
            <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Buzz + Torrent Swarm</span>
          </div>
        </div>

        {/* Quick Add Link Action */}
        <div className="p-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 glow-blue transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Download / Link</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
          {/* Transfer Swarm Status Filters (qBittorrent style) */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Transfers & Swarms
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveView("transfers-all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "transfers-all"
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive size={15} /> All Transfers
                </div>
                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setActiveView("transfers-downloading")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "transfers-downloading"
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowDown size={15} className="text-emerald-400" /> Downloading
                </div>
                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
                  {counts.downloading}
                </span>
              </button>

              <button
                onClick={() => setActiveView("transfers-seeding")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "transfers-seeding"
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUp size={15} className="text-blue-400" /> Seeding
                </div>
                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
                  {counts.seeding}
                </span>
              </button>

              <button
                onClick={() => setActiveView("transfers-completed")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "transfers-completed"
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={15} /> Completed
                </div>
                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
                  {counts.completed}
                </span>
              </button>
            </div>
          </div>

          {/* Buzz Channels Category Section */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Buzz Channels (Nostr)
            </div>
            <div className="space-y-1">
              {["General", "Software", "Media", "Gaming", "Documents"].map((ch) => {
                const key = `channel-${ch.toLowerCase()}`;
                const isSelected = activeView === key;
                return (
                  <button
                    key={ch}
                    onClick={() => setActiveView(key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                        : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                    }`}
                  >
                    <Hash size={14} className={isSelected ? "text-blue-400" : "text-slate-500"} />
                    <span>#{ch.toLowerCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discovery & Settings */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Network & WoT
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveView("search")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "search"
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <SearchIcon size={15} /> Global Discover
              </button>

              <button
                onClick={() => setActiveView("share")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "share"
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <Share2 size={15} /> Share Content
              </button>

              <button
                onClick={() => setActiveView("trust")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "trust"
                    ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <ShieldCheck size={15} /> Web of Trust
              </button>
            </div>
          </div>
        </div>

        {/* Network & Live Speeds Bottom Panel */}
        <div className="p-3 border-t border-[#1e293b]/50 bg-slate-950/40">
          <div className="glass-panel p-3 rounded-xl border border-slate-850 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-200">Decentralized Mesh</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{peerCount} peers</span>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60 font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <ArrowDown size={11} /> 3.4 MB/s
              </span>
              <span className="text-blue-400 flex items-center gap-1">
                <ArrowUp size={11} /> 1.5 MB/s
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Top Action Toolbar */}
        <header className="h-14 px-6 border-b border-slate-850/80 bg-slate-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={14} /> Add Magnet / Ticket
            </button>

            <button
              onClick={handlePickTorrent}
              className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileCode2 size={14} className="text-amber-400" /> Open .torrent
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500 font-bold uppercase">Protocols:</span>
              <span className="text-amber-400 font-semibold text-[11px]">BitTorrent v1/v2</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-semibold text-[11px]">Iroh Blobs</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-semibold text-[11px]">Nostr NIP-94</span>
            </div>
          </div>
        </header>

        {/* View Routing */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {activeView.startsWith("transfers-") && (
            <div className="flex-1 flex flex-col min-h-0">
              <TransfersView
                transfers={transfers}
                selectedTransfer={selectedTransfer}
                onSelectTransfer={setSelectedTransfer}
                onStreamMedia={(item) =>
                  setActiveMedia({
                    id: item.id,
                    title: item.name,
                    protocol: item.protocol,
                  })
                }
                statusFilter={activeView.replace("transfers-", "")}
                onRefresh={fetchTransfers}
              />
              {selectedTransfer && (
                <BottomInspector
                  transfer={selectedTransfer}
                  onClose={() => setSelectedTransfer(null)}
                  onStreamMedia={(fileName, isTorrent) =>
                    setActiveMedia({
                      id: selectedTransfer.id,
                      title: fileName,
                      protocol: isTorrent ? "BitTorrent" : "Iroh",
                    })
                  }
                />
              )}
            </div>
          )}

          {activeView.startsWith("channel-") && (
            <ChannelFeedView
              channel={activeView.replace("channel-", "")}
              onDownloadStarted={() => {
                setActiveView("transfers-all");
                fetchTransfers();
              }}
              onStreamMedia={(title, protocol) =>
                setActiveMedia({
                  id: "channel-stream",
                  title,
                  protocol,
                })
              }
            />
          )}

          {activeView === "search" && <Search />}
          {activeView === "share" && <Share />}
          {activeView === "trust" && <TrustManager />}
        </main>
      </div>

      {/* Add Transfer Modal */}
      <AddTransferModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTransfers}
      />

      {/* Floating Picture-in-Picture & Modal Media Player */}
      <MediaPlayer
        media={activeMedia}
        onClose={() => setActiveMedia(null)}
      />
    </div>
  );
}

export default App;
