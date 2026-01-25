import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Play, Clock, Eye } from "lucide-react";
import MovieCard from "../components/MovieCard";
import PreviewVideo from "../components/PreviewVideo";

const Home = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fixed: Track specific video ID instead of a boolean
  const [hoveredId, setHoveredId] = useState(null);

  const LIMIT = 5;
  const BASE_URL = "http://localhost:3000";

  const hoverTimeout = useRef(null);

  const onEnter = (id) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoveredId(id);
    }, 500);
  };

  const onLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredId(null);
  };

  const fetchVideos = async (query = "", pageNumber = 1) => {
    setLoading(true);

    const endpoint = query
      ? `/search?q=${query}&page=${pageNumber}&limit=${LIMIT}`
      : `/videos?page=${pageNumber}&limit=${LIMIT}`;

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`);
      const data = await res.json();

      setVideos(data.data || []);
      setPage(pageNumber);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos("", 1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVideos(searchQuery, 1);
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-zinc-500">
        <div className="animate-pulse font-medium">Discovering content...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* 1. Hero / Search Section */}
      <div className="relative h-[40vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

        <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
          EXPLORE
        </h1>

        <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md rounded-2xl py-4 pl-14 pr-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* 2. Content Grid */}
      <section className="max-w-[1800px] mx-auto px-6 md:px-12 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-600 rounded-full" />
            {searchQuery ? `Results for "${searchQuery}"` : "Recently Uploaded"}
          </h2>
          <span className="text-zinc-500 text-sm font-medium">{videos.length} videos</span>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500">No videos match your search.</p>
            <button onClick={() => { setSearchQuery(""); fetchVideos(); }} className="mt-4 text-indigo-400 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div
                key={video._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/watch/${video._id}`)}
              >
                {/* Custom Card Wrapper */}
                <div
                  className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 transition-transform duration-300 group-hover:-translate-y-2 shadow-xl"
                  onMouseEnter={() => onEnter(video._id)}
                  onMouseLeave={onLeave}
                >
                  {/* Thumbnail: Show when not hovered or when this specific card isn't active */}
                  {hoveredId !== video._id && (
                    <img
                      src={video.thumbnailPath}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Preview: Show only for the specifically hovered card */}
                  {hoveredId === video._id && video.previewPath && (
                    <PreviewVideo
                      src={video.previewPath}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-3 rounded-full text-black">
                      <Play fill="black" size={24} />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>

                <div className="mt-4 px-1">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-zinc-500 text-sm">
                    <span className="flex items-center gap-1"><Eye size={14} /> {video.views || 0}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-16">
          <button
            disabled={page === 1}
            onClick={() => fetchVideos(searchQuery, page - 1)}
            className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:bg-zinc-800 transition"
          >
            Prev
          </button>

          <span className="text-zinc-400 text-sm">
            Page <span className="text-white font-bold">{page}</span> of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => fetchVideos(searchQuery, page + 1)}
            className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:bg-zinc-800 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
