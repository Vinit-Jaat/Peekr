import { useEffect, useRef } from "react";
import Hls from "hls.js";

const PreviewVideo = ({ src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls;

    // 1. Clear any existing source to prevent binding conflicts
    video.pause();
    video.removeAttribute('src');
    video.load();

    if (Hls.isSupported()) {
      hls = new Hls({
        lowLatencyMode: true,
        enableWorker: true,
        // 🔥 FIX: Prevent credentials/pre-flight issues that cause aborts
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari (native HLS) - only set src as fallback
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    /* 🔥 IMPORTANT: No src attribute here */
    />
  );
};

export default PreviewVideo;
