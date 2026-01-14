import { useSearchParams, useNavigate } from "react-router-dom";
import HlsPlayer from "./HlsPlayer";

const PlayerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Get the path from the URL (?url=...)
  const videoPath = searchParams.get("url");

  // 2. Construct the full path to your backend
  const fullStreamUrl = `http://localhost:3000/${videoPath}`;

  return (
    <div className="min-h-screen bg-black flex flex-col p-8">
      <button
        onClick={() => navigate(-1)}
        className="text-white mb-4 self-start bg-zinc-800 px-4 py-2 rounded hover:bg-zinc-700"
      >
        ← Back
      </button>

      <div className="flex justify-center items-center flex-1">
        <div className="w-full max-w-4xl aspect-video bg-zinc-900 shadow-2xl overflow-hidden rounded-lg">
          {/* Your HlsPlayer component */}
          <HlsPlayer streamUrl={fullStreamUrl} />
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
