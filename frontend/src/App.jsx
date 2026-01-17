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
    <div className="flex flex-col min-h-screen w-full bg-[#09090b]">
      < Header />
      <main className="flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/watch/:id" element={<PlayerPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
