import { useState } from "react";

function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!video) {
      alert("Please add a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", thumbnail);
    formData.append("video", video);

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log(data.message);

      // Optional reset
      setTitle("");
      setDescription("");
      setVideo(null);
      setThumbnail(null);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-full flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-xl bg-gray-900 rounded-2xl shadow-lg p-8">
        <h2 className="text-white text-2xl font-bold mb-6">
          Upload Video
        </h2>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="Enter video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-1">
            Description
          </label>
          <textarea
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Video Upload */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-1">
            Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files[0])}
            className="w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-500"
          />
        </div>

        {/* Thumbnail Upload */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-1">
            Thumbnail Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files[0])}
            className="w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:bg-gray-700 file:text-white
              hover:file:bg-gray-600"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? "Uploading..." : "Submit"}
        </button>
      </div>
    </section>
  );
}

export default Upload;
