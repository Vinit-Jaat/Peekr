import { useState } from 'react'

function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const handleClick = async () => {
    /*if (!video) {
      alert("Please add video.");
      return;
    }*/

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", thumbnail);
    formData.append("video", video);


    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    console.log(data.message);
  }

  return (
    <>
      <div style={{ padding: "20px" }}>
        <h2>Send Data to Backend.</h2>

        <input type="text" placeholder='title' value={title} onChange={(e) => setTitle(e.target.value)} />
        <br />
        <input type="text" placeholder='description' value={description} onChange={(e) => setDescription(e.target.value)} />
        <br />
        <input type="file" accept='video/*' onChange={(e) => setVideo(e.target.files[0])} />
        <br />
        <input type="file" accept='image/*' onChange={(e) => setThumbnail(e.target.files[0])} />
        <br />
        <button onClick={handleClick}>Submit</button>
      </div>
    </>
  )
}

export default Upload;
