import './App.css'
import { Link, Routes, Route } from 'react-router-dom'
import Upload from '../pages/Upload.jsx'
import Home from '../pages/Home.jsx'
import Videos from '../pages/Videos.jsx'
import PlayerPage from '../pages/PlayerPage.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'


function App() {

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/watch/:id" element={<PlayerPage />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
