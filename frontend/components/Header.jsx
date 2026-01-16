import { NavLink } from 'react-router-dom'

function Header() {
  return (
    <header className="bg-gray-900 shadow-md">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">
          PeeKr
        </h1>

        <div className="flex gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition ${isActive
                ? 'text-blue-400'
                : 'text-gray-300 hover:text-white'
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `text-sm font-medium transition ${isActive
                ? 'text-blue-400'
                : 'text-gray-300 hover:text-white'
              }`
            }
          >
            Upload
          </NavLink>

          <NavLink
            to="/videos"
            className={({ isActive }) =>
              `text-sm font-medium transition ${isActive
                ? 'text-blue-400'
                : 'text-gray-300 hover:text-white'
              }`
            }
          >
            Videos
          </NavLink>
        </div>
      </nav>
    </header>
  )
}

export default Header
