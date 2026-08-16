import { useState, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Subtitles,
  Gauge,
  Film,
  Sparkles,
} from "lucide-react";

export interface MediaStreamSource {
  id: string;
  title: string;
  url?: string;
  protocol: string; // "BitTorrent" | "Iroh"
  mimeType?: string;
  subtitles?: { label: string; src: string }[];
}

interface MediaPlayerProps {
  media: MediaStreamSource | null;
  onClose: () => void;
}

export function MediaPlayer({ media, onClose }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPip, setIsPip] = useState(true); // Floating PiP by default
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(145);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("English");
  const [bufferedPercent] = useState(68);

  useEffect(() => {
    if (!media) return;
    setIsPlaying(true);
    setCurrentTime(0);
  }, [media]);

  if (!media) return null;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isPip
          ? "bottom-6 right-6 w-96 rounded-2xl shadow-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5"
          : "inset-6 rounded-3xl shadow-2xl border border-slate-850 bg-slate-950/98 backdrop-blur-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
      }`}
    >
      {/* Top Media Bar */}
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <Film size={13} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-200 truncate">{media.title}</h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="text-amber-400 font-semibold">{media.protocol} Stream</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Sparkles size={10} /> Sequential Buffer
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsPip(!isPip)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={isPip ? "Expand to Full Window" : "Minimize to Floating PiP"}
          >
            {isPip ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
            title="Close Player"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Video / Visualizer Canvas */}
      <div className={`relative bg-black flex items-center justify-center ${isPip ? "h-48" : "flex-1 min-h-0"}`}>
        {/* Mock Cinematic Video Surface / Visualizer */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/80 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center glow-blue text-blue-400 shadow-2xl">
            <Film size={28} className={isPlaying ? "animate-pulse" : ""} />
          </div>
          <span className="text-xs font-semibold text-slate-400 mt-3 font-mono">
            {isPlaying ? "Streaming BitTorrent Swarm Buffer..." : "Paused"}
          </span>

          {/* Subtitle Overlay */}
          {selectedSubtitle !== "Off" && (
            <div className="absolute bottom-4 px-4 py-1.5 bg-black/75 rounded-lg border border-slate-800 text-xs font-medium text-amber-200 text-center max-w-md shadow-lg">
              [Subtitles: {media.title}]
            </div>
          )}
        </div>
      </div>

      {/* Bottom Playback Controls */}
      <div className="p-3.5 bg-slate-900/80 border-t border-slate-850 flex flex-col gap-2">
        {/* Seek Bar with Buffer Visualizer */}
        <div className="space-y-1">
          <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
            {/* Downloaded / Buffered Chunk Indicator */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-slate-700/60 transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Playhead Progress */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-500 font-sans">
              Buffered {bufferedPercent}% ({media.protocol})
            </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 glow-blue transition-all cursor-pointer"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 text-slate-400 ml-1">
              <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-16 h-1 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Gauge size={12} />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl space-y-0.5 z-50">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`w-full px-3 py-1 text-left text-xs rounded-lg transition-colors cursor-pointer ${
                        playbackRate === rate ? "bg-blue-600 text-white font-bold" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles */}
            <div className="flex items-center gap-1">
              <Subtitles size={13} className="text-slate-400" />
              <select
                value={selectedSubtitle}
                onChange={(e) => setSelectedSubtitle(e.target.value)}
                className="bg-slate-800/80 text-slate-300 text-[11px] font-semibold rounded-lg px-2 py-1 border-none focus:outline-none cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Off">Off</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
