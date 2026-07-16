import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, UserPlus, Trash2 } from "lucide-react";

export function TrustManager() {
  const [trustedNodes] = useState([
    { pubkey: "z3xk...92jf", alias: "IrohFoundation", type: "bootstrap", added: "Built-in" },
    { pubkey: "x9as...11pz", alias: "LinuxISOs", type: "curated", added: "2 days ago" },
    { pubkey: "b88x...m39a", alias: "Alice", type: "friend", added: "1 week ago" },
  ]);

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Web of Trust</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Manage nodes whose ratings and comments you trust</p>
        </div>
        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer glow-blue">
          <UserPlus size={18} /> Add Node
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8 z-10">
        <div className="glass-card p-6 rounded-2xl border border-slate-800/60 flex items-start gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-lg">3 Trusted</h3>
            <p className="text-xs text-[#94a3b8] mt-1">Nodes you currently trust</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-800/60 flex items-start gap-4">
          <div className="p-3 bg-red-600/10 text-red-400 rounded-xl border border-red-500/20">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-lg">14 Blocked</h3>
            <p className="text-xs text-[#94a3b8] mt-1">Spammers hidden from search</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/30 glow-blue">
          <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20}/> Network Health</h3>
          <p className="text-xs text-blue-100 mt-2">Your WoT filters are actively hiding 98% of known spam from your search results.</p>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden z-10">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-850/60 bg-slate-900/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-5">Public Key / Alias</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-3">Added</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="p-2 space-y-1">
          {trustedNodes.map((node, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-800/25 rounded-xl transition-colors items-center group">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-300">
                  {node.alias.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">{node.alias}</h4>
                  <p className="text-xs text-[#94a3b8] font-mono mt-0.5">{node.pubkey}</p>
                </div>
              </div>
              <div className="col-span-3">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  node.type === 'bootstrap' ? 'bg-purple-500/5 text-purple-400 border-purple-500/15' :
                  node.type === 'curated' ? 'bg-blue-500/5 text-blue-400 border-blue-500/15' :
                  'bg-emerald-500/5 text-emerald-400 border-emerald-500/15'
                }`}>
                  {node.type}
                </span>
              </div>
              <div className="col-span-3 text-sm text-[#94a3b8]">
                {node.added}
              </div>
              <div className="col-span-1 text-right">
                <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
