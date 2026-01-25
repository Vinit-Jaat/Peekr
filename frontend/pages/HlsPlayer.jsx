import React, { useRef, useEffect, useState, useCallback } from "react";
import HLS from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Check,
} from "lucide-react";

const CustomHlsPlayer = ({ streamUrl }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);

  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  /* 🔥 QUALITY STATE */
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = AUTO

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = useCallback((e) => {
    if (
      e &&
      (e.target.closest(".control-bar-buttons") ||
        e.target.closest(".settings-menu"))
    ) {
      return;
    }

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  /* =========================
      HLS INIT (FIXED FOR NS_BINDING_ABORTED)
  ========================= */
  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    // Cleanup previous instance before starting new one
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (HLS.isSupported()) {
      const hls = new HLS({
        autoStartLoad: true,
        capLevelToPlayerSize: true,
        // Prevent credentials/pre-flight issues that cause aborts
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);

      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        // ✅ REMOVE audio-only (0p) levels
        const videoLevels = hls.levels.filter(
          (l) => typeof l.height === "number" && l.height > 0
        );

        setLevels(videoLevels);
        setCurrentLevel(-1); // AUTO always default
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } else if (
      videoRef.current.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // For Safari: Only set src if HLS.js is not supported
      videoRef.current.src = streamUrl;
    }
  }, [streamUrl]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isNaN(video.duration)) return;

    setProgress((video.currentTime / video.duration) * 100);

    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered((bufferedEnd / video.duration) * 100);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    videoRef.current.volume = newVol;
  };

  const changeSpeed = (speed) => {
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  };

  /* 🔥 FIXED QUALITY SWITCH */
  const changeQuality = (uiIndex) => {
    if (!hlsRef.current) return;

    // AUTO
    if (uiIndex === -1) {
      hlsRef.current.currentLevel = -1;
      setCurrentLevel(-1);
      return;
    }

    const selectedHeight = levels[uiIndex]?.height;
    if (!selectedHeight) return;

    // Map UI index → real HLS index
    const realIndex = hlsRef.current.levels.findIndex(
      (l) => l.height === selectedHeight
    );

    if (realIndex !== -1) {
      hlsRef.current.currentLevel = realIndex;
      setCurrentLevel(uiIndex);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative group w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={() => {
        setShowControls(true);
        clearTimeout(window.controlTimeout);
        window.controlTimeout = setTimeout(() => setShowControls(false), 3000);
      }}
      onClick={togglePlay}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* FIX: Removed src={streamUrl} from here. 
          Standard <video> tags abort .m3u8 sources on desktop browsers.
          HLS.js handles the source via attachMedia.
      */}
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current.duration)}
        playsInline
      />

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-500 flex flex-col justify-end p-4 md:p-8 ${showControls ? "opacity-100" : "opacity-0"
          }`}
      >
        {/* Scrubber */}
        <div
          className="relative w-full h-1.5 bg-zinc-600/50 rounded-full mb-6 cursor-pointer group/scrubber hover:h-2 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime =
              pos * videoRef.current.duration;
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-zinc-400/40 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full flex justify-end items-center"
            style={{ width: `${progress}%` }}
          >
            <div className="w-3 h-3 bg-white rounded-full scale-0 group-hover/scrubber:scale-100 transition-transform shadow-lg translate-x-1.5" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="control-bar-buttons flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:text-indigo-400 transition-colors"
            >
              {isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" />
              )}
            </button>

            <div className="flex items-center gap-3 group/vol">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next = volume === 0 ? 1 : 0;
                  setVolume(next);
                  videoRef.current.volume = next;
                }}
              >
                {volume === 0 ? (
                  <VolumeX size={22} className="text-zinc-400" />
                ) : (
                  <Volume2 size={22} className="text-white" />
                )}
              </button>

              <div className="relative w-0 group-hover/vol:w-24 transition-all duration-300 overflow-hidden h-1 bg-zinc-600 rounded-full">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-24 accent-white cursor-pointer h-1"
                />
              </div>
            </div>

            <span className="text-sm font-medium text-zinc-300 select-none tracking-wider">
              {formatTime(videoRef.current?.currentTime)} /{" "}
              {formatTime(duration)}
            </span>
          </div>

          {/* Settings */}
          <div className="flex items-center gap-5 relative">
            {showSettings && (
              <div
                className="settings-menu absolute bottom-12 right-0 w-52 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Playback Speed */}
                <div className="p-3 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                  Playback Speed
                </div>

                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-indigo-600 flex items-center justify-between"
                  >
                    {speed === 1 ? "Normal" : `${speed}x`}
                    {playbackSpeed === speed && <Check size={14} />}
                  </button>
                ))}

                {/* QUALITY */}
                <div className="p-3 text-xs font-bold text-zinc-500 uppercase tracking-widest border-t border-zinc-800">
                  Quality
                </div>

                <button
                  onClick={() => changeQuality(-1)}
                  className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-indigo-600 flex justify-between"
                >
                  Auto
                  {currentLevel === -1 && <Check size={14} />}
                </button>

                {levels.map((l, i) => (
                  <button
                    key={i}
                    onClick={() => changeQuality(i)}
                    className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-indigo-600 flex justify-between"
                  >
                    {l.height}p
                    {currentLevel === i && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className={`text-white hover:rotate-90 transition-transform duration-500 ${showSettings ? "text-indigo-400 rotate-90" : ""
                }`}
            >
              <Settings size={22} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullScreen();
              }}
              className="text-white hover:scale-110 transition-transform"
            >
              {isFullScreen ? (
                <Minimize size={24} />
              ) : (
                <Maximize size={24} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomHlsPlayer;
