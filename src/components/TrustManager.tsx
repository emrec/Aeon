import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, UserPlus, Trash2, X, AlertTriangle, ShieldX } from "lucide-react";

interface Node {
  pubkey: string;
  alias: string;
  type: string;
  added: string;
  reason?: string; // only for blocked nodes
}

export function TrustManager() {
  const [trustedNodes, setTrustedNodes] = useState<Node[]>([
    { pubkey: "z3xk...92jf", alias: "IrohFoundation", type: "bootstrap", added: "Built-in" },
    { pubkey: "x9as...11pz", alias: "LinuxISOs", type: "curated", added: "2 days ago" },
    { pubkey: "b88x...m39a", alias: "Alice", type: "friend", added: "1 week ago" },
  ]);

  const [blockedNodes, setBlockedNodes] = useState<Node[]>([
    { pubkey: "sp9x...k22p", alias: "SpamBot_99", type: "blocked", added: "3 hours ago", reason: "Flooding index with empty files" },
    { pubkey: "ad12...88zz", alias: "AdNetwork_Direct", type: "blocked", added: "1 day ago", reason: "Spamming commercial links in Software channel" },
    { pubkey: "fake...u77x", alias: "FakeUbuntuSeed", type: "blocked", added: "3 days ago", reason: "Providing corrupt payload for ISO downloads" },
  ]);

  // Visual state to represent total blocked nodes (14 in counter, 3 detailed here, 11 hidden)
  const totalBlockedCount = blockedNodes.length + 11;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [newPubkey, setNewPubkey] = useState("");
  const [newType, setNewType] = useState("friend");

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim() || !newPubkey.trim()) return;

    const newNode: Node = {
      pubkey: newPubkey.trim(),
      alias: newAlias.trim(),
      type: newType,
      added: "Just now",
    };

    setTrustedNodes([...trustedNodes, newNode]);
    setNewAlias("");
    setNewPubkey("");
    setNewType("friend");
    setShowAddForm(false);
  };

  const handleRemoveNode = (pubkey: string) => {
    setTrustedNodes(trustedNodes.filter((n) => n.pubkey !== pubkey));
  };

  const handleBlockNode = (node: Node) => {
    // Remove from trusted
    setTrustedNodes(trustedNodes.filter((n) => n.pubkey !== node.pubkey));
    // Add to blocked
    setBlockedNodes([
      ...blockedNodes,
      {
        ...node,
        type: "blocked",
        added: "Just now",
        reason: "Manually blocked by user",
      },
    ]);
  };

  const handleUnblockNode = (node: Node) => {
    // Remove from blocked
    setBlockedNodes(blockedNodes.filter((n) => n.pubkey !== node.pubkey));
    // Add back to trusted as 'friend'
    setTrustedNodes([
      ...trustedNodes,
      {
        pubkey: node.pubkey,
        alias: node.alias,
        type: "friend",
        added: "Just now",
      },
    ]);
  };

  return (
    <div className="p-8 h-full flex flex-col relative animate-fade-in">
      <div className="mb-8 flex justify-between items-center z-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Web of Trust</h2>
          <p className="text-[#94a3b8] mt-1 text-sm">Manage nodes whose ratings and comments you trust</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer glow-blue"
        >
          <UserPlus size={18} /> Add Node
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 z-10">
        <div className="glass-card p-6 rounded-2xl border border-slate-800/60 flex items-start gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 animate-pulse-slow">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-lg">{trustedNodes.length} Trusted</h3>
            <p className="text-xs text-[#94a3b8] mt-1">Nodes whose updates are indexed</p>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-2xl border border-slate-800/60 flex items-start gap-4">
          <div className="p-3 bg-red-600/10 text-red-400 rounded-xl border border-red-500/20">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-lg">{totalBlockedCount} Blocked</h3>
            <p className="text-xs text-[#94a3b8] mt-1">Spammers hidden from search</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/30 glow-blue">
          <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20}/> Network Health</h3>
          <p className="text-xs text-blue-100 mt-2">Your WoT filters are actively hiding 98% of known spam from your search results.</p>
        </div>
      </div>

      {/* Add Node Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-blue-400" />
              Add Trusted Node
            </h3>
            <form onSubmit={handleAddNodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alias / Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bob" 
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Node Public Key / ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. z3xk...92jf" 
                  value={newPubkey}
                  onChange={(e) => setNewPubkey(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trust Category</label>
                <select 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="friend">Friend / Private Node</option>
                  <option value="curated">Curated Index Source</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer glow-blue"
              >
                Add to Web of Trust
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 z-10">
        
        {/* Trusted Nodes List */}
        <div className="lg:col-span-7 flex flex-col glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-850/60 bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Trusted Nodes (WoT Core)</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {trustedNodes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <ShieldCheck className="h-10 w-10 text-slate-600 mb-2" />
                <h4 className="text-sm font-semibold text-slate-400">No trusted nodes configured</h4>
                <p className="text-xs text-slate-500 mt-1">Add nodes to start indexing verified documents.</p>
              </div>
            ) : (
              trustedNodes.map((node) => (
                <div key={node.pubkey} className="p-4 hover:bg-slate-800/25 rounded-xl transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                      {node.alias.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-200 truncate">{node.alias}</h4>
                      <p className="text-xs text-[#94a3b8] font-mono mt-0.5 truncate">{node.pubkey}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded border ${
                      node.type === 'bootstrap' ? 'bg-purple-500/5 text-purple-400 border-purple-500/10' :
                      node.type === 'curated' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' :
                      'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                    }`}>
                      {node.type}
                    </span>
                    <button 
                      onClick={() => handleBlockNode(node)}
                      title="Block Node"
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <ShieldX size={16} />
                    </button>
                    <button 
                      onClick={() => handleRemoveNode(node.pubkey)}
                      title="Remove"
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blocked Nodes List */}
        <div className="lg:col-span-5 flex flex-col glass-panel rounded-2xl overflow-hidden border border-red-500/5 bg-red-500/[0.01]">
          <div className="p-4 border-b border-slate-850/60 bg-red-950/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} />
              Spam Filtering & Blocks
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="p-3 mb-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 flex items-start gap-2.5 leading-normal">
              <AlertTriangle className="text-amber-500 shrink-0" size={14} />
              <p>
                Nodes listed here are blocked because they flooded gossip swarms or shared malformed blobs. Their search index is hidden.
              </p>
            </div>

            {blockedNodes.map((node) => (
              <div key={node.pubkey} className="p-3 bg-red-950/[0.05] border border-red-950/10 hover:border-red-950/20 rounded-xl transition-all flex flex-col gap-2 group">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-300 text-sm truncate">{node.alias}</h4>
                    <p className="text-[10px] text-[#94a3b8] font-mono mt-0.5 truncate">{node.pubkey}</p>
                  </div>
                  <button 
                    onClick={() => handleUnblockNode(node)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800 text-[10px] font-bold transition-all cursor-pointer shrink-0"
                  >
                    Unblock
                  </button>
                </div>
                {node.reason && (
                  <p className="text-[11px] text-red-300/70 bg-red-950/15 p-2 rounded-lg border border-red-950/10">
                    <span className="font-bold text-red-300">Offense:</span> {node.reason}
                  </p>
                )}
              </div>
            ))}

            {/* Hidden list count wrapper to explain the remaining blocked */}
            <div className="p-3.5 border border-dashed border-slate-800/80 rounded-xl text-center text-xs text-slate-500 font-medium">
              + 11 auto-filtered bootstrap bootstrap nodes (offline/inactive spam blacklist)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
