import { useState } from "react";
import "./App.css";
import { Search } from "./components/Search";
import { Transfers } from "./components/Transfers";
import { TrustManager } from "./components/TrustManager";
import { Search as SearchIcon, Download, ShieldCheck } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          {/* Logo / Title */}
          <div className="flex items-center gap-2 px-2 py-5 border-b border-gray-200">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg leading-none">A</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent ml-2">
              Aeon
            </h1>
          </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === "search" ? "bg-blue-50 text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100" : "hover:bg-gray-100 text-gray-600 font-medium"
            }`}
          >
            <SearchIcon size={20} className={activeTab === "search" ? "text-blue-600" : "text-gray-400"} /> Search
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === "transfers" ? "bg-blue-50 text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100" : "hover:bg-gray-100 text-gray-600 font-medium"
            }`}
          >
            <Download size={20} className={activeTab === "transfers" ? "text-blue-600" : "text-gray-400"} /> Transfers
          </button>
          <button
            onClick={() => setActiveTab("trust")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === "trust" ? "bg-blue-50 text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100" : "hover:bg-gray-100 text-gray-600 font-medium"
            }`}
          >
            <ShieldCheck size={20} className={activeTab === "trust" ? "text-blue-600" : "text-gray-400"} /> Trust Manager
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50/50">
        {activeTab === "search" && <Search />}
        {activeTab === "transfers" && <Transfers />}
        {activeTab === "trust" && <TrustManager />}
      </main>
    </div>
  );
}

export default App;
