import { useEffect, useRef } from "react";
import Hls from "hls.js";

function HlsPlayer({ streamUrl }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!streamUrl) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = streamUrl;
    }

    return () => hls?.destroy();
  }, [streamUrl]);

  return <video ref={videoRef} controls width="600" />;
}

export default HlsPlayer;
