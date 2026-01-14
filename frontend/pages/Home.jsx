// pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";

const Home = () => {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define your backend URL constant
  const BASE_URL = "http://localhost:3000";

  useEffect(() => {
    fetch(`${BASE_URL}/videos`)
      .then((res) => res.json())
      .then((data) => {
        // According to your response: { success: true, data: [...] }
        setVideos(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  const handleCardClick = (videoPath) => {
    navigate(`/watch?url=${encodeURIComponent(videoPath)}`);
  };

  return (
    <div className="min-h-screen bg-black p-6 md:p-12">
      <h2 className="text-white text-3xl font-bold mb-8">Recently Added</h2>

      {/* grid-cols-1: 1 card on mobile
          md:grid-cols-2: 2 cards on tablets
          lg:grid-cols-3: EXACTLY 3 cards on desktop
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <MovieCard
            key={video._id}
            thumbnail={`${BASE_URL}/${video.thumbnailPath}`}
            title={video.title}
            description={video.description}
            onClick={() => handleCardClick(video.videoPath)}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
