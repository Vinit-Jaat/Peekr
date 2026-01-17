import { NavLink } from 'react-router-dom';
import { Upload, Home, PlayCircle, Library } from 'lucide-react';

function Header() {
  return (
    <header className="sticky top-0 z-[100] w-full bg-[#09090b] border-b border-zinc-800/60">
      <nav className="max-w-[1800px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">

        {/* Logo Section */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <PlayCircle size={22} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tighter italic">
            PEEKR
          </h1>
        </NavLink>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 md:gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-zinc-800 text-white shadow-inner'
                : 'text-zinc-500 hover:text-zinc-200'
              }`
            }
          >
            <Home size={18} />
            <span className="hidden sm:inline">Home</span>
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-zinc-800 text-white shadow-inner'
                : 'text-zinc-500 hover:text-zinc-200'
              }`
            }
          >
            <Upload size={18} />
            <span className="hidden sm:inline">Upload</span>
          </NavLink>

          {/* Vertical Separator */}
          <div className="w-[1px] h-6 bg-zinc-800 mx-2 hidden sm:block" />

          <NavLink
            to="/videos"
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`
            }
          >
            <Library size={18} />
            <span className="hidden md:inline">My Library</span>
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Header;
