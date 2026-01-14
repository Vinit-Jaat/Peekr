import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";

const Home = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE_URL = "http://localhost:3000";

  useEffect(() => {
    fetch(`${BASE_URL}/videos`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // FIX: This function expects an ID string
  const handleCardClick = (id) => {
    // Navigate to local route /watch/ID
    navigate(`/watch/${id}`);
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black p-6 md:p-12">
      <h2 className="text-white text-3xl font-bold mb-8 uppercase tracking-tighter">Recently Added</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <MovieCard
            key={video._id} // MongoDB unique ID
            thumbnail={`${BASE_URL}/${video.thumbnailPath}`}
            title={video.title}
            description={video.description}
            // FIX: Pass video._id specifically here
            onClick={() => handleCardClick(video._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
