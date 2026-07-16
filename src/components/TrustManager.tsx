import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, UserPlus, Trash2 } from "lucide-react";

export function TrustManager() {
  const [trustedNodes] = useState([
    { pubkey: "z3xk...92jf", alias: "IrohFoundation", type: "bootstrap", added: "Built-in" },
    { pubkey: "x9as...11pz", alias: "LinuxISOs", type: "curated", added: "2 days ago" },
    { pubkey: "b88x...m39a", alias: "Alice", type: "friend", added: "1 week ago" },
  ]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Web of Trust</h2>
          <p className="text-gray-500 mt-1">Manage nodes whose ratings and comments you trust</p>
        </div>
        <button className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm">
          <UserPlus size={18} /> Add Node
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">3 Trusted</h3>
            <p className="text-sm text-gray-500 mt-1">Nodes you currently trust</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">14 Blocked</h3>
            <p className="text-sm text-gray-500 mt-1">Spammers hidden from search</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-md text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20}/> Network Health</h3>
          <p className="text-sm text-blue-100 mt-2">Your WoT filters are actively hiding 98% of known spam from your search results.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-5">Public Key / Alias</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-3">Added</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="p-2">
          {trustedNodes.map((node, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors items-center">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 border-2 border-white shadow-sm"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">{node.alias}</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{node.pubkey}</p>
                </div>
              </div>
              <div className="col-span-3">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  node.type === 'bootstrap' ? 'bg-purple-100 text-purple-700' :
                  node.type === 'curated' ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {node.type}
                </span>
              </div>
              <div className="col-span-3 text-sm text-gray-600">
                {node.added}
              </div>
              <div className="col-span-1 text-right">
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
