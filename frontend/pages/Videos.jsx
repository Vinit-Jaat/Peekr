import { useEffect, useState } from "react";
import HlsPlayer from "./HlsPlayer";

function Videos() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/videos")
      .then(res => res.json())
      .then(data => setVideos(data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Video List</h1>

      {videos.map(video => (
        <div key={video._id} style={{ marginBottom: "40px" }}>
          <h3>{video.title}</h3>
          <p>{video.description}</p>

          {/* 🔥 HLS Player */}
          {/* <HlsPlayer */}
          {/*   streamUrl={`http://localhost:3000/${video.videoPath}`} */}
          {/* /> */}
          {/* <br /> */}

          <img
            src={`http://localhost:3000/${video.thumbnailPath}`}
            alt="thumbnail"
            width="200"
          />
        </div>
      ))}
    </div>
  );
}

export default Videos;
