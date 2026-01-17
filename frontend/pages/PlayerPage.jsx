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
        <div className="animate-pulse">Loading please wait ...</div>
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
        {/* Updated Metadata Section */}
        <div className="w-full max-w-[1800px] mx-auto px-6 md:px-12 mt-10 mb-20 text-left">
          <div className="flex flex-col gap-4">
            {/* Title with extra-wide allowance */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              {videoData.title}
            </h1>

            {/* Modern Indigo Accent Line */}
            <div className="h-1.5 w-24 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"></div>

            {/* Description: Removed max-w-4xl to allow it to fill the cinematic width */}
            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mt-4 whitespace-pre-wrap">
              {videoData.description}
            </p>

            {/* Optional: Add View/Date Metadata back for production feel */}
            <div className="flex items-center gap-6 mt-4 text-zinc-500 text-sm font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                {videoData.views || 0} Views
              </span>
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                {new Date(videoData.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayerPage;
