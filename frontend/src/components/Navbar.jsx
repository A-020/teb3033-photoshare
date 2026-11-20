import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Top bar shown only to logged-in users
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">PhotoShare</NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>Feed</NavLink>
          <NavLink to="/upload">Upload</NavLink>
          <NavLink to="/groups">Groups</NavLink>
        </nav>
        <div className="nav-user">
          <span className="muted">{user.username}</span>
          <button type="button" className="btn btn-small btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
