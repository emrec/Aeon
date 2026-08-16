import { useState } from "react";
import { Hash, Download, Send, FileCode2, Film } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface ChannelFeedViewProps {
  channel: string;
  onDownloadStarted: () => void;
  onStreamMedia?: (title: string, protocol: string) => void;
}

interface ChannelPost {
  id: string;
  author: string;
  pubkey: string;
  content: string;
  timestamp: string;
  file?: {
    name: string;
    size: string;
    hash: string;
    protocol: string;
  };
}

export function ChannelFeedView({ channel, onDownloadStarted, onStreamMedia }: ChannelFeedViewProps) {
  const [messages, setMessages] = useState<ChannelPost[]>([
    {
      id: "1",
      author: "IrohFoundation",
      pubkey: "z3xk...92jf",
      content: "Welcome to the #" + channel.toLowerCase() + " channel! Verified torrents and Iroh blobs are indexed globally on Nostr.",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      author: "LinuxISOs",
      pubkey: "x9as...11pz",
      content: "Latest verified desktop build published with high speed seeders:",
      timestamp: "35 mins ago",
      file: {
        name: "ubuntu-24.04-desktop-amd64.iso",
        size: "4.7 GB",
        hash: "magnet:?xt=urn:btih:2d8144b7880597b6e6d3dfd63a9a9efae3f533d3",
        protocol: "BitTorrent",
      },
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newPost: ChannelPost = {
      id: Date.now().toString(),
      author: "You",
      pubkey: "npub1local...self",
      content: inputMessage.trim(),
      timestamp: "Just now",
    };

    setMessages([...messages, newPost]);
    setInputMessage("");
  };

  const handleDownloadFile = async (hash: string) => {
    try {
      await invoke("download", { hash });
      onDownloadStarted();
    } catch (err) {
      console.error("Failed to download", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/30">
      {/* Channel Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Hash size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              #{channel.toLowerCase()}
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Nostr Swarm
              </span>
            </h3>
            <p className="text-xs text-slate-400">Decentralized topic stream for {channel.toLowerCase()} files, reviews, and discussion</p>
          </div>
        </div>
      </div>

      {/* Message & Shared Content Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((post) => (
          <div key={post.id} className="glass-card p-4 rounded-2xl border border-slate-850/80 flex items-start gap-3.5 group">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {post.author.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-slate-200">{post.author}</span>
                <span className="text-[10px] text-slate-500 font-mono">{post.pubkey}</span>
                <span className="text-[10px] text-slate-600">• {post.timestamp}</span>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{post.content}</p>

              {post.file && (
                <div className="mt-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4 max-w-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                      <FileCode2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">{post.file.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{post.file.size}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-medium">{post.file.protocol}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onStreamMedia && (
                      <button
                        onClick={() => onStreamMedia(post.file!.name, post.file!.protocol)}
                        className="px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Film size={13} />
                        Stream
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadFile(post.file!.hash)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer glow-blue"
                    >
                      <Download size={13} />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Channel Input Bar */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/80 bg-slate-900/30 flex gap-3">
        <input
          type="text"
          placeholder={`Message #${channel.toLowerCase()} or share magnet link...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer glow-blue"
        >
          <Send size={14} />
          Send
        </button>
      </form>
    </div>
  );
}
