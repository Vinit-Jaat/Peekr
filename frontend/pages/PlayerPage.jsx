import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; // Optional: npm install lucide-react
import HlsPlayer from "./HlsPlayer";

const PlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);

  const BASE_URL = "http://localhost:3000";

  useEffect(() => {
    fetch(`${BASE_URL}/videos/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setVideoData(json.data);
      })
      .catch((err) => console.error("Error fetching video metadata:", err));
  }, [id]);

  // Disable Right-Click Function
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  if (!videoData) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-medium">
        <div className="animate-pulse">Loading cinematic experience...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-all duration-300"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Library</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-center px-4 md:px-10">

        {/* Video Player Container */}
        <div
          onContextMenu={handleContextMenu} // Disables right-click
          className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden bg-black shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-zinc-800/50"
        >
          <HlsPlayer streamUrl={`${BASE_URL}/${videoData.videoPath}`} />
        </div>

        {/* Video Info Section */}
        <div className="w-full max-w-6xl mt-10 mb-20 text-left">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              {videoData.title}
            </h1>

            <div className="h-1 w-20 bg-indigo-600 rounded-full"></div>

            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-4xl mt-2">
              {videoData.description}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayerPage;
