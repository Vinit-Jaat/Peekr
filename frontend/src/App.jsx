import './App.css'
import { Link, Routes, Route } from 'react-router-dom'
import Upload from '../pages/Upload.jsx'
import Home from '../pages/Home.jsx'
import Videos from '../pages/Videos.jsx'


function App() {

  return (
    <>
      <nav>
        <Link to='/' >Home</Link>
        <Link to='/upload' >Upload</Link>
        <Link to='/videos' >Videos</Link>
      </nav >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/videos" element={<Videos />} />
      </Routes>
    </>
  )
}

export default App
