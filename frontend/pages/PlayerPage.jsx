import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HlsPlayer from "./HlsPlayer";

const PlayerPage = () => {
  const { id } = useParams(); // Matches :id in App.jsx
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);
  const BASE_URL = "http://localhost:3000";

  useEffect(() => {
    // Fetch specifically by the MongoDB _id
    fetch(`${BASE_URL}/videos/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setVideoData(json.data);
      })
      .catch((err) => console.error("Error fetching video metadata:", err));
  }, [id]);

  if (!videoData) return <div className="bg-black min-h-screen text-white p-10">Initializing Stream...</div>;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center">
      <div className="w-full p-4">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
          ← Back to Gallery
        </button>
      </div>

      <div className="w-full max-w-6xl aspect-video bg-zinc-900 shadow-2xl">
        {/* Pass the full backend URL to your HlsPlayer */}
        <HlsPlayer streamUrl={`${BASE_URL}/${videoData.videoPath}`} />
      </div>

      <div className="max-w-6xl w-full p-6 text-left">
        <h1 className="text-white text-4xl font-black mb-2">{videoData.title}</h1>
        <p className="text-zinc-400 text-lg leading-relaxed">{videoData.description}</p>
      </div>
    </div>
  );
};

export default PlayerPage;
