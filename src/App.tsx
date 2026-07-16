import { useState } from "react";
import "./App.css";
import { Search } from "./components/Search";
import { Transfers } from "./components/Transfers";
import { TrustManager } from "./components/TrustManager";
import { Search as SearchIcon, Download, ShieldCheck } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="flex h-screen bg-[#090d16] text-[#f8fafc] overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      <aside className="w-64 glass-panel flex flex-col z-10 border-r border-[#1e293b]/50">
          {/* Logo / Title */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1e293b]/50">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 glow-blue">
              <span className="text-white font-bold text-lg leading-none">A</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                AEON
              </h1>
              <span className="text-[10px] text-blue-400/80 font-bold tracking-widest uppercase">P2P Network</span>
            </div>
          </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-250 cursor-pointer ${
              activeTab === "search" 
                ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 glow-blue" 
                : "hover:bg-slate-800/40 text-[#94a3b8] hover:text-[#f8fafc] font-medium"
            }`}
          >
            <SearchIcon size={18} className={activeTab === "search" ? "text-blue-400" : "text-[#94a3b8]"} /> Discover
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-250 cursor-pointer ${
              activeTab === "transfers" 
                ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 glow-blue" 
                : "hover:bg-slate-800/40 text-[#94a3b8] hover:text-[#f8fafc] font-medium"
            }`}
          >
            <Download size={18} className={activeTab === "transfers" ? "text-blue-400" : "text-[#94a3b8]"} /> Transfers
          </button>
          <button
            onClick={() => setActiveTab("trust")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-250 cursor-pointer ${
              activeTab === "trust" 
                ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 glow-blue" 
                : "hover:bg-slate-800/40 text-[#94a3b8] hover:text-[#f8fafc] font-medium"
            }`}
          >
            <ShieldCheck size={18} className={activeTab === "trust" ? "text-blue-400" : "text-[#94a3b8]"} /> Trust Manager
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto z-10 relative">
        {activeTab === "search" && <Search />}
        {activeTab === "transfers" && <Transfers />}
        {activeTab === "trust" && <TrustManager />}
      </main>
    </div>
  );
}

export default App;
