import { useState } from "react";
import { Play, Pause, X, ArrowUpRight, ArrowDownRight, HardDrive } from "lucide-react";

export function Transfers() {
  const [transfers] = useState([
    { id: 1, name: "ubuntu-24.04-desktop-amd64.iso", progress: 65, speed: "12.4 MB/s", eta: "4m 12s", size: "4.7 GB", type: "download", status: "downloading" },
    { id: 2, name: "blender-4.1.0-windows-x64.zip", progress: 100, speed: "0 KB/s", eta: "-", size: "312 MB", type: "seeding", status: "completed" },
  ]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Transfers</h2>
          <p className="text-gray-500 mt-1">Manage active downloads and seeding blobs</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <ArrowDownRight className="text-emerald-500" size={18} />
            <span className="text-sm font-bold">12.4 MB/s</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <ArrowUpRight className="text-blue-500" size={18} />
            <span className="text-sm font-bold">1.2 MB/s</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {transfers.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${t.type === 'download' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {t.type === 'download' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><HardDrive size={14} /> {t.size}</span>
                    <span className="font-medium text-gray-700">{t.speed}</span>
                    {t.type === 'download' && <span>ETA: {t.eta}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                  {t.status === 'downloading' ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${t.type === 'download' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${t.progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-right text-xs font-semibold text-gray-500">
              {t.progress}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
