import { useState } from "react";
import { Play, Pause, X, ArrowUpRight, ArrowDownRight, HardDrive } from "lucide-react";

export function Transfers() {
  const [transfers] = useState([
    { id: 1, name: "ubuntu-24.04-desktop-amd64.iso", progress: 65, speed: "12.4 MB/s", eta: "4m 12s", size: "4.7 GB", type: "download", status: "downloading", peers: 12 },
    { id: 2, name: "blender-4.1.0-windows-x64.zip", progress: 100, speed: "0 KB/s", eta: "-", size: "312 MB", type: "seeding", status: "completed", peers: 4 },
  ]);

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Transfers</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Manage active downloads, seeding swarms, and gossip peers</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800/80">
            <ArrowDownRight className="text-emerald-400" size={18} />
            <span className="text-sm font-bold text-slate-200">12.4 MB/s</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800/80">
            <ArrowUpRight className="text-blue-400" size={18} />
            <span className="text-sm font-bold text-slate-200">1.2 MB/s</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 z-10">
        {transfers.map((t) => (
          <div key={t.id} className="glass-card p-5 rounded-2xl shadow-lg border border-slate-800/60 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${t.type === 'download' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'}`}>
                  {t.type === 'download' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">{t.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-[#94a3b8] mt-1">
                    <span className="flex items-center gap-1"><HardDrive size={14} /> {t.size}</span>
                    <span className="font-semibold text-slate-300">{t.speed}</span>
                    {t.type === 'download' && <span>ETA: {t.eta}</span>}
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                      {t.peers} gossip peers
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors cursor-pointer">
                  {t.status === 'downloading' ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="w-full bg-slate-950/60 border border-slate-850 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${t.type === 'download' ? 'bg-gradient-to-r from-emerald-500 to-teal-400 glow-blue' : 'bg-gradient-to-r from-blue-500 to-indigo-500 glow-blue'}`}
                style={{ width: `${t.progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-right text-xs font-bold text-[#94a3b8]">
              {t.progress}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
