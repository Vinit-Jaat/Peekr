import { useEffect, useState } from "react";

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnailPath: string;
}

export default function DeleteVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchVideos = async (search?: string) => {
    setLoading(true);

    const url = search
      ? `http://localhost:3000/search?q=${encodeURIComponent(search)}`
      : `http://localhost:3000/videos?limit=10`;

    const res = await fetch(url);
    const json = await res.json();

    setVideos(json.data || []);
    setLoading(false);
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Delete this video permanently?")) return;

    await fetch(`http://localhost:3000/videos/${id}`, {
      method: "DELETE",
    });

    fetchVideos(query);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Delete Videos</h1>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Search by title or description"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && fetchVideos(query)}
      />

      {loading && <p>Loading...</p>}

      <ul className="space-y-4">
        {videos.map((v) => (
          <li
            key={v._id}
            className="flex items-center gap-4 border p-3 rounded overflow-hidden"
          >
            {/* Thumbnail */}
            <img
              src={v.thumbnailPath}
              alt={v.title}
              className="w-24 h-14 object-cover flex-shrink-0 rounded"
            />

            {/* Text container */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold line-clamp-1">
                {v.title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {v.description}
              </p>
            </div>

            {/* Delete button */}
            <button
              onClick={() => deleteVideo(v._id)}
              className="bg-red-600 text-white px-3 py-1 rounded flex-shrink-0"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
