import { useState } from "react";
import { Upload as UploadIcon, Film, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";

function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" }); // For success/error feedback

  const handleUpload = async () => {
    if (!video || !thumbnail || !title) {
      setStatus({ type: "error", message: "Please fill in all fields and select files." });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", thumbnail);
    formData.append("video", video);

    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: "success", message: "Video uploaded and processing started!" });
        // Reset form
        setTitle("");
        setDescription("");
        setVideo(null);
        setThumbnail(null);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#09090b] flex items-center justify-center py-12 px-4">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-500">
            <UploadIcon size={24} />
          </div>
          <div>
            <h2 className="text-white text-2xl font-black tracking-tight">Upload Video</h2>
            <p className="text-zinc-500 text-sm">Upload and publish your content</p>
          </div>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${status.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}>
            {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {status.message}
          </div>
        )}

        <div className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2 ml-1">
              Video Title
            </label>
            <input
              type="text"
              placeholder="Give your masterpiece a name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl bg-zinc-800/50 border border-zinc-700/50 text-white px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2 ml-1">
              Description
            </label>
            <textarea
              placeholder="Tell your viewers about this video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-2xl bg-zinc-800/50 border border-zinc-700/50 text-white px-5 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* File Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Video File */}
            <div className="relative group">
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                Video File
              </label>
              <div className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all ${video ? "border-indigo-500/50 bg-indigo-500/5" : "border-zinc-700 group-hover:border-zinc-500 bg-zinc-800/30"
                }`}>
                <Film size={24} className={video ? "text-indigo-400" : "text-zinc-600"} />
                <span className="text-xs text-zinc-500 mt-2 text-center break-all px-2">
                  {video ? video.name : "Select MP4/MOV"}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideo(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Thumbnail File */}
            <div className="relative group">
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                Thumbnail
              </label>
              <div className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all ${thumbnail ? "border-indigo-500/50 bg-indigo-500/5" : "border-zinc-700 group-hover:border-zinc-500 bg-zinc-800/30"
                }`}>
                <ImageIcon size={24} className={thumbnail ? "text-indigo-400" : "text-zinc-600"} />
                <span className="text-xs text-zinc-500 mt-2 text-center break-all px-2">
                  {thumbnail ? thumbnail.name : "Select JPG/PNG"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest py-5 rounded-2xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl shadow-indigo-500/10"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Video...
              </span>
            ) : "Publish Video"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default Upload;
