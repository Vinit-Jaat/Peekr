import { useEffect, useState } from "react";
import HlsPlayer from "./HlsPlayer"; // Ensure this matches your filename

function Videos() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/videos")
      .then((res) => res.json())
      .then((data) => setVideos(data.data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Video List</h1>
      <div style={{ display: "grid", gap: "20px" }}>
        {videos.map((video) => (
          <div key={video._id} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
            <h3>{video.title}</h3>
            <p>{video.description}</p>

            {/* 🔥 HLS Player - Uses the full SeaweedFS URL from DB */}
            <div style={{ maxWidth: "500px", background: "#000" }}>
              <HlsPlayer streamUrl={video.videoPath} />
            </div>

            <div style={{ marginTop: "10px" }}>
              <strong>Thumbnail:</strong> <br />
              {/* Uses the full SeaweedFS URL from DB */}
              <img
                src={video.thumbnailPath}
                alt="thumbnail"
                style={{ width: "200px", borderRadius: "4px", marginTop: "5px" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Videos;
