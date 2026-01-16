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
        setVideos(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const handleCardClick = (id) => {
    navigate(`/watch/${id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-gray-300">
        Loading videos...
      </div>
    );
  }

  return (
    <section className="min-h-full bg-black px-6 md:px-12 py-8">

      {videos.length === 0 ? (
        <div className="text-gray-400 text-center mt-20">
          No videos available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <MovieCard
              key={video._id}
              thumbnail={`${BASE_URL}/${video.thumbnailPath}`}
              title={video.title}
              description={video.description}
              onClick={() => handleCardClick(video._id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Home;
