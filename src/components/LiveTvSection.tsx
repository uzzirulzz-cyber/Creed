import Hls from 'hls.js';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  ShoppingCart,
  Signal,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { LiveTvChannel, LiveTvPlan, TvChannelCategory } from '../types/store';
import type { ActiveView } from './Navbar';
import { StorefrontFooter } from './StorefrontFooter';

interface LiveTvSectionProps {
  channels: LiveTvChannel[];
  plans: LiveTvPlan[];
  globalSearch: string;
  onAddToCart: (sku: string) => void;
  onSelectView: (view: ActiveView) => void;
  onShowToast: (msg: string) => void;
}

const CHANNEL_CATEGORIES: Array<'All' | 'Watchlist' | TvChannelCategory> = [
  'All',
  'Watchlist',
  'News',
  'Sports',
  'Entertainment',
  'Movies',
  'Documentary',
  'Kids',
  'Regional & World',
];

function getChannelArtwork(ch: LiveTvChannel): string {
  if (ch.imageUrl) return ch.imageUrl;
  switch (ch.category) {
    case 'Sports':
      return '/assets/playbeat/tv/sports.jpg';
    case 'Movies':
      return '/assets/playbeat/tv/cinema.jpg';
    case 'Documentary':
      return '/assets/playbeat/tv/space.jpg';
    case 'Kids':
      return '/assets/playbeat/tv/kids.jpg';
    case 'Entertainment':
      return '/assets/playbeat/tv/entertainment.jpg';
    case 'Regional & World':
      return '/assets/playbeat/tv/regional.jpg';
    default:
      return '/assets/playbeat/tv/news.jpg';
  }
}

export function LiveTvSection({
  channels,
  plans,
  globalSearch,
  onAddToCart,
  onSelectView,
  onShowToast,
}: LiveTvSectionProps) {
  const { watchlistIds, toggleWatchlistChannel } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Watchlist' | TvChannelCategory>('All');
  const [channelSearch, setChannelSearch] = useState('');
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'playing' | 'error'>('connecting');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const [hlsLevels, setHlsLevels] = useState<Array<{ index: number; label: string }>>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1);

  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || channels[0] || null,
    [channels, activeChannelId],
  );

  const filteredChannels = useMemo(() => {
    const q = (channelSearch || globalSearch).trim().toLowerCase();
    return channels.filter((ch) => {
      if (selectedCategory === 'Watchlist' && !watchlistIds.includes(ch.id)) return false;
      if (
        selectedCategory !== 'All' &&
        selectedCategory !== 'Watchlist' &&
        ch.category !== selectedCategory
      ) {
        return false;
      }
      if (
        q &&
        !ch.name.toLowerCase().includes(q) &&
        !ch.category.toLowerCase().includes(q) &&
        !ch.country.toLowerCase().includes(q) &&
        !ch.language.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [channels, selectedCategory, channelSearch, globalSearch, watchlistIds]);

  // Real Embedded HLS Live Broadcast Player (Zero Canvas Demo — Streams Real .m3u8 via Same-Origin Proxy)
  useEffect(() => {
    if (!activeChannel) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const rawUrl = activeChannel.streamUrl?.trim() || '';
    if (!rawUrl || !rawUrl.startsWith('http')) {
      setStreamStatus('error');
      setStreamError('No live HLS stream URL is configured for this channel.');
      return;
    }

    const proxiedUrl = `/api/livetv/hls-proxy?url=${encodeURIComponent(rawUrl)}`;
    setStreamStatus('connecting');
    setStreamError(null);
    setHlsLevels([]);
    setSelectedLevel(-1);

    let destroyed = false;
    let hls: Hls | null = null;

    const onPlaying = () => {
      if (!destroyed) {
        setStreamStatus('playing');
        setStreamError(null);
      }
    };
    const onWaiting = () => {
      if (!destroyed) setStreamStatus('connecting');
    };
    const onVideoError = () => {
      if (!destroyed) {
        setStreamStatus('error');
        setStreamError('Broadcast signal temporarily interrupted. Click Retry or switch channels.');
      }
    };

    videoEl.addEventListener('playing', onPlaying);
    videoEl.addEventListener('waiting', onWaiting);
    videoEl.addEventListener('error', onVideoError);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 20,
      });
      hlsRef.current = hls;
      hls.loadSource(proxiedUrl);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, (_ev, data) => {
        if (destroyed) return;
        const levels = (data.levels || []).map((lvl, idx) => ({
          index: idx,
          label: lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)} kbps`,
        }));
        setHlsLevels(levels);
        videoEl.muted = isMuted;
        videoEl.volume = volume;
        if (isPlaying) {
          void videoEl.play().catch(() => {
            // Browser autoplay policy may require muted start
            videoEl.muted = true;
            setIsMuted(true);
            void videoEl.play().catch(() => {});
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_ev, data) => {
        if (destroyed || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
          setStreamStatus('error');
          setStreamError('Live broadcast feed did not respond. Retry or select another channel.');
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
        } else {
          setStreamStatus('error');
          setStreamError('Stream playback error on this broadcast feed. Try Retry or another channel.');
        }
      });
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = proxiedUrl;
      videoEl.muted = isMuted;
      videoEl.volume = volume;
      if (isPlaying) {
        void videoEl.play().catch(() => {});
      }
    } else {
      setStreamStatus('error');
      setStreamError('Your browser does not support HLS live video playback.');
    }

    return () => {
      destroyed = true;
      videoEl.removeEventListener('playing', onPlaying);
      videoEl.removeEventListener('waiting', onWaiting);
      videoEl.removeEventListener('error', onVideoError);
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      videoEl.removeAttribute('src');
      videoEl.load();
    };
  }, [activeChannel, retryCounter]);

  // Sync play/pause, mute, volume, and HLS quality level without reloading stream
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = isMuted;
    videoEl.volume = volume;
    if (isPlaying) {
      void videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  }, [isPlaying, isMuted, volume]);

  useEffect(() => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = selectedLevel;
    }
  }, [selectedLevel]);

  const handleToggleWatchlist = async (channel: LiveTvChannel) => {
    try {
      const added = await toggleWatchlistChannel(channel);
      onShowToast(
        added
          ? `${channel.name} saved to your Playbeat Watchlist.`
          : `${channel.name} removed from your Playbeat Watchlist.`,
      );
    } catch {
      onShowToast('Could not update watchlist right now.');
    }
  };

  const handleSelectChannel = (ch: LiveTvChannel) => {
    setActiveChannelId(ch.id);
    setIsPlaying(true);
    playerShellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleStepChannel = (delta: number) => {
    if (channels.length === 0 || !activeChannel) return;
    const idx = channels.findIndex((c) => c.id === activeChannel.id);
    const nextIdx = (idx + delta + channels.length) % channels.length;
    setActiveChannelId(channels[nextIdx].id);
    setIsPlaying(true);
  };

  const handleToggleFullscreen = () => {
    const shell = playerShellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void shell.requestFullscreen?.();
    }
  };

  return (
    <>
      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 pb-4">
        <section id="section3-livetv" className="scroll-mt-20 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
              <p className="text-[#ffc928] text-[12px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                PLAYBEAT LIVE TV · REAL-TIME HLS BROADCASTS
              </p>
              <h1 className="text-[clamp(1.8rem,5vw,2.6rem)] font-extrabold leading-tight mt-1">
                Playbeat <span className="text-[#1ea0ff]">LIVE TV</span>
              </h1>
              <p className="mt-1 text-sm font-medium text-[#c8d3ea] max-w-2xl">
                Watch live international news, Pakistan broadcasts, MENA networks, sports, documentaries, and kids TV directly inside Playbeat.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#ffd958]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 px-3 py-1 text-rose-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {channels.filter((c) => c.isLive).length} LIVE STREAMS
              </span>
            </div>
          </div>

          {/* ══════════════ REAL EMBEDDED HLS VIDEO PLAYER ══════════════ */}
          {activeChannel && (
            <div
              ref={playerShellRef}
              className="edge rounded-2xl overflow-hidden bg-[#02081a]"
            >
              <div className="relative aspect-video w-full bg-[#020614] overflow-hidden">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted={isMuted}
                  poster={getChannelArtwork(activeChannel)}
                  className="w-full h-full object-contain bg-black"
                />

                {/* Top-left On-Air Overlay Pill */}
                <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-[#030a1fd9] border border-[#2154d4] px-3 py-1.5 text-[11px] font-bold text-[#f2f6ff] pointer-events-none">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      streamStatus === 'playing'
                        ? 'bg-rose-500 animate-pulse'
                        : streamStatus === 'connecting'
                          ? 'bg-[#ffd958] animate-pulse'
                          : 'bg-slate-400'
                    }`}
                  />
                  <span className="uppercase tracking-wider">
                    {streamStatus === 'playing'
                      ? 'LIVE'
                      : streamStatus === 'connecting'
                        ? 'CONNECTING'
                        : 'SIGNAL LOST'}
                  </span>
                  <span className="text-[#ffd958]">| {activeChannel.name}</span>
                </div>

                {/* Connecting Spinner Overlay */}
                {streamStatus === 'connecting' && isPlaying && (
                  <div className="absolute inset-0 bg-[#030a1f88] flex flex-col items-center justify-center gap-2.5 z-10 pointer-events-none">
                    <Loader2 className="w-9 h-9 text-[#ffd958] animate-spin" />
                    <p className="text-xs font-bold text-[#f2f6ff] tracking-wide">
                      Tuning into live HLS stream: {activeChannel.name}...
                    </p>
                  </div>
                )}

                {/* Error Recovery Overlay */}
                {streamStatus === 'error' && (
                  <div className="absolute inset-0 bg-[#030a1fe6] flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                    <AlertTriangle className="w-9 h-9 text-[#ffd958]" />
                    <div className="max-w-md space-y-1">
                      <p className="text-sm font-extrabold text-[#f2f6ff]">{activeChannel.name}</p>
                      <p className="text-xs text-[#c8d3ea]">
                        {streamError || 'Unable to load this broadcast feed right now.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRetryCounter((c) => c + 1)}
                        className="yb rounded-full px-5 h-9 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Stream
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepChannel(1)}
                        className="ob rounded-full px-5 h-9 text-xs font-bold bg-[#061236] hover:bg-[#0b2a8a] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        Next Channel
                        <ChevronRight className="w-3.5 h-3.5 text-[#ffd958]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paused Overlay */}
                {!isPlaying && streamStatus !== 'error' && (
                  <div className="absolute inset-0 bg-[#030a1fbb] backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      className="yb w-16 h-16 rounded-full grid place-items-center shadow-[0_0_30px_rgba(255,217,88,0.5)]"
                      aria-label="Resume live broadcast"
                    >
                      <Play className="w-7 h-7 fill-current ml-0.5" />
                    </button>
                    <p className="text-xs font-bold text-[#f2f6ff] tracking-wide uppercase">
                      Paused · Click to Resume {activeChannel.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Embedded Player Control Bar */}
              <div className="bg-[#040d29] border-t border-[#1d4ed866] px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    aria-label={isPlaying ? 'Pause stream' : 'Play stream'}
                    className="yb w-9 h-9 rounded-full grid place-items-center shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepChannel(-1)}
                      aria-label="Previous channel"
                      className="ob w-8 h-8 rounded-full grid place-items-center bg-[#061236] hover:bg-[#0b2a8a] text-[#f2f6ff] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepChannel(1)}
                      aria-label="Next channel"
                      className="ob w-8 h-8 rounded-full grid place-items-center bg-[#061236] hover:bg-[#0b2a8a] text-[#f2f6ff] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pl-1">
                    <button
                      type="button"
                      onClick={() => setIsMuted((m) => !m)}
                      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                      className="text-[#f2f6ff] hover:text-[#ffd958] cursor-pointer"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-[#ffd958]" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setVolume(next);
                        if (next > 0 && isMuted) setIsMuted(false);
                        if (next === 0) setIsMuted(true);
                      }}
                      aria-label="Player volume"
                      className="w-16 sm:w-20 accent-[#ffd958] cursor-pointer"
                    />
                  </div>

                  <div className="hidden md:block pl-2 border-l border-[#1d4ed855] min-w-0">
                    <p className="text-xs font-extrabold text-[#f2f6ff] truncate flex items-center gap-1.5">
                      <Signal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {activeChannel.name}
                    </p>
                    <p className="text-[10.5px] text-[#9eb2db] truncate">
                      {activeChannel.nowPlaying || activeChannel.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {hlsLevels.length > 0 && (
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(Number(e.target.value))}
                      aria-label="HLS stream quality"
                      className="pb-input px-2.5 py-1 text-[11px] font-mono w-auto"
                    >
                      <option value={-1} className="bg-[#051239]">
                        Auto ({activeChannel.quality})
                      </option>
                      {hlsLevels.map((lvl) => (
                        <option key={lvl.index} value={lvl.index} className="bg-[#051239]">
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleToggleWatchlist(activeChannel)}
                    className="ob rounded-full px-3 h-8 text-[11px] font-bold inline-flex items-center gap-1.5 bg-[#061236] hover:bg-[#0b2a8a] cursor-pointer"
                  >
                    {watchlistIds.includes(activeChannel.id) ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-[#ffd958]" />
                        <span className="hidden sm:inline">Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5 text-[#1ea0ff]" />
                        <span className="hidden sm:inline">Watchlist</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFullscreen}
                    aria-label="Toggle fullscreen"
                    className="ob w-8 h-8 rounded-full grid place-items-center bg-[#061236] hover:bg-[#0b2a8a] text-[#f2f6ff] cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ CHANNEL FILTER BAR + VISUAL IMAGE PRODUCT CARDS ══════════════ */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {CHANNEL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? 'cat-active text-white border border-[#2f8bff]'
                        : 'bg-[#051239cc] text-[#c8d3ea] hover:text-white border border-[#1d4ed888]'
                    }`}
                  >
                    {cat}
                    {cat === 'Watchlist' && watchlistIds.length > 0 ? ` (${watchlistIds.length})` : ''}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ob rounded-full px-3 h-8 w-full sm:w-[230px] bg-[#040d29cc]">
                <Search className="w-3.5 h-3.5 text-[#c8d3ea] shrink-0" />
                <input
                  type="search"
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  placeholder="Search live channels..."
                  aria-label="Search live TV channels"
                  className="bg-transparent outline-none w-full text-[11px] text-[#f2f6ff] placeholder:text-[#9eb2db]"
                />
              </div>
            </div>

            {filteredChannels.length === 0 ? (
              <div className="edge rounded-2xl p-8 text-center text-xs text-[#c8d3ea]">
                {selectedCategory === 'Watchlist'
                  ? 'Your watchlist is empty. Bookmark any channel card to save it here.'
                  : 'No LIVE TV channels matched your search.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredChannels.map((ch) => {
                  const isSelected = activeChannel?.id === ch.id;
                  const isSaved = watchlistIds.includes(ch.id);
                  const imgSrc = getChannelArtwork(ch);

                  return (
                    <article
                      key={ch.id}
                      className={`edge rounded-xl overflow-hidden flex flex-col group transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#ffd958] border-[#ffd958]'
                          : 'hover:border-[#2f8bff]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectChannel(ch)}
                        className="relative aspect-video w-full overflow-hidden bg-[#030a1f] cursor-pointer text-left"
                        aria-label={`Watch ${ch.name} live`}
                      >
                        <img
                          src={imgSrc}
                          alt={ch.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030a1fe6] via-transparent to-[#030a1f88]" />

                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#030a1fcc] border border-rose-500/60 px-2 py-0.5 text-[9.5px] font-extrabold text-rose-300 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          {isSelected ? 'WATCHING' : 'LIVE'}
                        </span>

                        <span className="absolute top-2 right-2 rounded bg-[#030a1fcc] border border-[#2154d4] px-1.5 py-0.5 text-[9.5px] font-mono font-bold text-[#ffd958]">
                          {ch.quality}
                        </span>

                        <span
                          className={`absolute inset-0 m-auto w-11 h-11 rounded-full grid place-items-center transition-all ${
                            isSelected
                              ? 'bg-[#ffd958] text-[#030a1f] scale-100 shadow-[0_0_20px_rgba(255,217,88,0.65)]'
                              : 'bg-[#030a1fcc] border border-[#2f8bff] text-[#ffd958] opacity-85 group-hover:opacity-100 group-hover:scale-110'
                          }`}
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </span>

                        <span className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold text-[#e6eeff]">
                          <span className="truncate text-[#1ea0ff]">{ch.category}</span>
                          <span className="text-[#c8d3ea] truncate ml-2">{ch.country}</span>
                        </span>
                      </button>

                      <div className="p-3 flex-1 flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleSelectChannel(ch)}
                          className="text-left font-bold text-[13px] text-[#f2f6ff] hover:text-[#ffd958] line-clamp-1 cursor-pointer flex items-center gap-1.5"
                        >
                          <Tv className="w-3.5 h-3.5 text-[#1ea0ff] shrink-0" />
                          <span className="truncate">{ch.name}</span>
                        </button>

                        <p className="text-[11px] text-[#c8d3ea] mt-1 line-clamp-2 min-h-[30px] leading-snug">
                          {ch.nowPlaying || ch.tagline}
                        </p>

                        <div className="mt-auto pt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectChannel(ch)}
                            className={`rounded-full h-8 flex-1 text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected ? 'bg-[#1ea0ff] text-[#030a1f]' : 'yb'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            {isSelected ? 'Playing Now' : 'Watch Live'}
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleToggleWatchlist(ch)}
                            aria-label={
                              isSaved
                                ? `Remove ${ch.name} from watchlist`
                                : `Save ${ch.name} to watchlist`
                            }
                            className="ob w-8 h-8 rounded-full grid place-items-center bg-[#040d29] hover:bg-[#0b2a8a] shrink-0 cursor-pointer"
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-3.5 h-3.5 text-[#ffd958]" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5 text-[#c8d3ea]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══════════════ PLAYBEAT TV PREMIUM STREAMING PASSES ══════════════ */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
              <div>
                <h3 className="text-lg font-extrabold text-[#f2f6ff]">
                  Playbeat TV <span className="text-[#ffd958]">Premium Streaming Passes</span>
                </h3>
                <p className="text-xs text-[#c8d3ea]">
                  Instant Xtream API credentials &amp; 16-digit ActiveCodes issued directly inside your Playbeat checkout receipt.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={`edge rounded-2xl p-5 flex flex-col justify-between relative ${
                    plan.featured ? 'ring-1 ring-[#ffd958]/60' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold">
                      <span className="text-[#1ea0ff] uppercase">{plan.lineType}</span>
                      <span className="rounded-full bg-[#ffd958]/15 border border-[#ffd958]/50 px-2.5 py-0.5 text-[#ffd958] font-mono">
                        {plan.durationLabel}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-[#f2f6ff] mt-2">{plan.name}</h4>
                    <p className="text-[11.5px] text-[#c8d3ea] mt-1">
                      {plan.channelsCount} · {plan.vodLibrary} · {plan.connections}{' '}
                      {plan.connections === 1 ? 'Device' : 'Devices'}
                    </p>

                    <ul className="mt-3.5 space-y-1.5 border-t border-[#1d4ed844] pt-3">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-[#e6eeff]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#ffd958] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#1d4ed855] flex items-center justify-between gap-3">
                    <div className="font-mono tabular-nums">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-[#ffd958]">
                          ${plan.priceUsd.toFixed(2)}
                        </span>
                        {plan.originalPriceUsd > plan.priceUsd && (
                          <span className="text-[11px] text-[#9eb2db] line-through">
                            ${plan.originalPriceUsd.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#c8d3ea]">
                        ≈ ₨{plan.pricePkr.toLocaleString()} PKR
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToCart(plan.sku)}
                      className="yb rounded-full px-5 h-9 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Buy Pass
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <StorefrontFooter
        currentPage="live-tv"
        onSelectView={onSelectView}
        onShowToast={onShowToast}
      />
    </>
  );
}
