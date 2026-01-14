import './App.css'
import { Link, Routes, Route } from 'react-router-dom'
import Upload from '../pages/Upload.jsx'
import Home from '../pages/Home.jsx'


function App() {

  return (
    <>
      <nav>
        <Link to='/' >Home</Link>
        <Link to='/upload' >Upload</Link>
      </nav >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </>
  )
}

export default App
