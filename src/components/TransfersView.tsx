import { useState, useMemo } from "react";
import { Play, Pause, Trash2, HardDrive, Copy, Check, Film, Search, ArrowUpDown, AlertTriangle, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TransferItem } from "./BottomInspector";
import { formatBytes } from "../utils/format";

interface TransfersViewProps {
  transfers: TransferItem[];
  selectedTransfer: TransferItem | null;
  onSelectTransfer: (t: TransferItem | null) => void;
  onStreamMedia?: (t: TransferItem) => void;
  statusFilter: string;
  onRefresh: () => void;
}

type SortKey = "name" | "size" | "progress" | "status" | "speed" | "peers";

export function TransfersView({
  transfers,
  selectedTransfer,
  onSelectTransfer,
  onStreamMedia,
  statusFilter,
  onRefresh,
}: TransfersViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TransferItem | null>(null);
  const [deleteFromDisk, setDeleteFromDisk] = useState(false);

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await invoke("remove_transfer", {
        id: deleteTarget.id,
        isTorrent: deleteTarget.is_torrent,
        deleteFiles: deleteFromDisk,
      });
      if (selectedTransfer?.id === deleteTarget.id) {
        onSelectTransfer(null);
      }
      setDeleteTarget(null);
      setDeleteFromDisk(false);
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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Filter and sort transfers
  const filteredTransfers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = transfers.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.hash.toLowerCase().includes(q)) {
        return false;
      }
      const st = t.status.toLowerCase();
      if (statusFilter === "all") return true;
      if (statusFilter === "downloading") return st.includes("down") || st.includes("init");
      if (statusFilter === "seeding") return st.includes("seed") || (t.progress >= 100 && !st.includes("pause"));
      if (statusFilter === "completed") return t.progress >= 100 || st.includes("comp");
      if (statusFilter === "paused") return st.includes("pause");
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "size") cmp = a.size - b.size;
      else if (sortKey === "progress") cmp = a.progress - b.progress;
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "speed") cmp = (a.down_speed_bytes || 0) - (b.down_speed_bytes || 0);
      else if (sortKey === "peers") cmp = a.peers - b.peers;
      return sortAsc ? cmp : -cmp;
    });
  }, [transfers, statusFilter, searchQuery, sortKey, sortAsc]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40 relative">
      {/* Filter & Search Sub-header */}
      <div className="px-4 py-2 border-b border-slate-850/80 bg-slate-900/30 flex items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter transfers by name or hash..."
            className="w-full pl-8 pr-3 py-1 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="text-slate-300 font-semibold">{filteredTransfers.length}</span> of {transfers.length} transfers
        </div>
      </div>

      {/* Dense Sortable Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none shrink-0">
        <button
          onClick={() => toggleSort("name")}
          className="col-span-4 flex items-center gap-1 hover:text-white cursor-pointer text-left"
        >
          <span>Name</span>
          <ArrowUpDown size={10} className={sortKey === "name" ? "text-blue-400" : "opacity-40"} />
        </button>
        <button
          onClick={() => toggleSort("size")}
          className="col-span-1 flex items-center gap-1 hover:text-white cursor-pointer text-left"
        >
          <span>Size</span>
          <ArrowUpDown size={10} className={sortKey === "size" ? "text-blue-400" : "opacity-40"} />
        </button>
        <button
          onClick={() => toggleSort("progress")}
          className="col-span-2 flex items-center gap-1 hover:text-white cursor-pointer text-left"
        >
          <span>Progress</span>
          <ArrowUpDown size={10} className={sortKey === "progress" ? "text-blue-400" : "opacity-40"} />
        </button>
        <button
          onClick={() => toggleSort("status")}
          className="col-span-1 flex items-center justify-center gap-1 hover:text-white cursor-pointer"
        >
          <span>Status</span>
        </button>
        <button
          onClick={() => toggleSort("speed")}
          className="col-span-1 flex items-center justify-end gap-1 hover:text-white cursor-pointer"
        >
          <span>Down Speed</span>
          <ArrowUpDown size={10} className={sortKey === "speed" ? "text-blue-400" : "opacity-40"} />
        </button>
        <button
          onClick={() => toggleSort("peers")}
          className="col-span-1 flex items-center justify-end gap-1 hover:text-white cursor-pointer"
        >
          <span>Peers</span>
          <ArrowUpDown size={10} className={sortKey === "peers" ? "text-blue-400" : "opacity-40"} />
        </button>
        <div className="col-span-1 text-right">ETA</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850/40">
        {filteredTransfers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <HardDrive size={32} className="text-slate-600 mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No transfers match this filter</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Use "Add Magnet / Ticket" or drop a .torrent file to begin downloading.
            </p>
          </div>
        ) : (
          filteredTransfers.map((item) => {
            const isSelected = selectedTransfer?.id === item.id;
            const isPaused = item.status.toLowerCase().includes("pause");
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
                  {formatBytes(item.size)}
                </div>

                {/* Progress Bar */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className="flex-1 bg-slate-850 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPaused
                          ? "bg-amber-500/70"
                          : item.progress >= 100
                          ? "bg-emerald-500"
                          : "bg-blue-500"
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
                        : isPaused
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : item.status === "Error"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
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
                  {onStreamMedia && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStreamMedia(item);
                      }}
                      title="Stream / Play Media"
                      className="p-1 text-blue-400 hover:text-white hover:bg-blue-600/30 rounded transition-colors cursor-pointer"
                    >
                      <Film size={13} />
                    </button>
                  )}

                  {isPaused ? (
                    <button
                      onClick={(e) => handleResume(e, item)}
                      title="Resume Transfer"
                      className="p-1 text-emerald-400 hover:text-white hover:bg-emerald-600/30 rounded transition-colors cursor-pointer"
                    >
                      <Play size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handlePause(e, item)}
                      title="Pause Transfer"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(item);
                      setDeleteFromDisk(false);
                    }}
                    title="Remove Transfer"
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl relative"
          >
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Remove Transfer</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{deleteTarget.name}</p>
              </div>
            </div>

            {deleteTarget.is_torrent && (
              <label className="flex items-center gap-2.5 p-3 my-4 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={deleteFromDisk}
                  onChange={(e) => setDeleteFromDisk(e.target.checked)}
                  className="rounded accent-red-500 cursor-pointer"
                />
                <span>Also permanently delete downloaded files from disk</span>
              </label>
            )}

            <div className="flex justify-end gap-2.5 mt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
