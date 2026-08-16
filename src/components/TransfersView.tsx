import { useState } from "react";
import { Play, Pause, Trash2, HardDrive, Copy, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TransferItem } from "./BottomInspector";

interface TransfersViewProps {
  transfers: TransferItem[];
  selectedTransfer: TransferItem | null;
  onSelectTransfer: (t: TransferItem | null) => void;
  statusFilter: string;
  onRefresh: () => void;
}

export function TransfersView({
  transfers,
  selectedTransfer,
  onSelectTransfer,
  statusFilter,
  onRefresh,
}: TransfersViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handlePause = async (e: React.MouseEvent, item: TransferItem) => {
    e.stopPropagation();
    try {
      await invoke("pause_transfer", { id: item.id, isTorrent: item.is_torrent });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async (e: React.MouseEvent, item: TransferItem) => {
    e.stopPropagation();
    try {
      await invoke("resume_transfer", { id: item.id, isTorrent: item.is_torrent });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: TransferItem) => {
    e.stopPropagation();
    try {
      await invoke("remove_transfer", { id: item.id, isTorrent: item.is_torrent, deleteFiles: false });
      if (selectedTransfer?.id === item.id) {
        onSelectTransfer(null);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const copyHash = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedId(hash);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter transfers based on status filter
  const filteredTransfers = transfers.filter((t) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "downloading") return t.status.toLowerCase().includes("down");
    if (statusFilter === "seeding") return t.status.toLowerCase().includes("seed") || t.progress >= 100;
    if (statusFilter === "completed") return t.progress >= 100 || t.status.toLowerCase().includes("comp");
    if (statusFilter === "paused") return t.status.toLowerCase().includes("pause");
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40">
      {/* Dense Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none shrink-0">
        <div className="col-span-4">Name</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-2">Progress</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-right">Down Speed</div>
        <div className="col-span-1 text-right">Seeds/Peers</div>
        <div className="col-span-1 text-right">ETA</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850/40">
        {filteredTransfers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <HardDrive size={32} className="text-slate-600 mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No active transfers in this view</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Use "Add Link" at the top to download Magnet links, .torrent files, or Iroh tickets.
            </p>
          </div>
        ) : (
          filteredTransfers.map((item) => {
            const isSelected = selectedTransfer?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectTransfer(item)}
                className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs transition-colors cursor-pointer select-none group ${
                  isSelected ? "bg-blue-600/15 border-l-2 border-blue-500" : "hover:bg-slate-900/40"
                }`}
              >
                {/* Name & Protocol */}
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider shrink-0 border ${
                      item.protocol === "BitTorrent"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {item.protocol === "BitTorrent" ? "Torrent" : "Iroh"}
                  </span>
                  <span className="font-medium text-slate-200 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>

                {/* Size */}
                <div className="col-span-1 font-mono text-slate-300 text-xs truncate">
                  {formatSize(item.size)}
                </div>

                {/* Progress Bar */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className="flex-1 bg-slate-850 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.progress >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0 w-9 text-right">
                    {item.progress.toFixed(0)}%
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      item.status === "Seeding" || item.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : item.status === "Paused"
                        ? "bg-slate-800 text-slate-400 border-slate-700"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Down Speed */}
                <div className="col-span-1 text-right font-mono font-medium text-emerald-400 truncate">
                  {item.down_speed}
                </div>

                {/* Seeds / Peers */}
                <div className="col-span-1 text-right font-mono text-slate-400 text-[11px] truncate">
                  <span className="text-slate-200 font-semibold">{item.peers}</span> ({item.seeds})
                </div>

                {/* ETA */}
                <div className="col-span-1 text-right font-mono text-slate-400 text-[11px] truncate">
                  {item.eta}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1.5 shrink-0">
                  {item.status === "Paused" ? (
                    <button
                      onClick={(e) => handleResume(e, item)}
                      title="Resume"
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Play size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handlePause(e, item)}
                      title="Pause"
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Pause size={13} />
                    </button>
                  )}

                  <button
                    onClick={(e) => copyHash(e, item.hash)}
                    title="Copy Magnet/Ticket"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  >
                    {copiedId === item.hash ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, item)}
                    title="Delete"
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
