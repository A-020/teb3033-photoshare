import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Camera, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const LINKS = [
  { to: '/', label: 'Feed', end: true },
  { to: '/groups', label: 'Groups' },
  { to: '/upload', label: 'Upload' },
]

// Transparent navbar: brand on the left, a glass pill of links in the centre,
// and round glass buttons on the right (account menu, and a menu button on phones).
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef(null)

  function closeMenus() {
    setAccountOpen(false)
    setMenuOpen(false)
  }

  // Close the open menu on a click outside the navbar or on Escape
  useEffect(() => {
    if (!accountOpen && !menuOpen) return
    function onPointer(e) {
      if (!headerRef.current?.contains(e.target)) closeMenus()
    }
    function onKey(e) {
      if (e.key === 'Escape') closeMenus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen, menuOpen])

  if (!user) return null

  function handleLogout() {
    closeMenus()
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar" ref={headerRef}>
      <div className="navbar-inner">
        <NavLink to="/" className="brand" onClick={closeMenus}>
          <Camera size={22} aria-hidden="true" />
          PhotoShare
        </NavLink>

        <nav className="nav-pill glass" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              <span className="nav-dot" aria-hidden="true" />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <div className="account">
            <button
              type="button"
              className="round-btn glass"
              onClick={() => {
                setAccountOpen((o) => !o)
                setMenuOpen(false)
              }}
              aria-label={`Account menu for ${user.username}`}
              aria-expanded={accountOpen}
              aria-controls="account-menu"
            >
              {user.username.charAt(0).toUpperCase()}
            </button>
            {accountOpen && (
              <div id="account-menu" className="dropdown glass">
                <div className="dropdown-user">
                  <Avatar name={user.username} size={36} />
                  <div>
                    <strong>{user.username}</strong>
                    <span className="muted">{user.email}</span>
                  </div>
                </div>
                <button type="button" className="dropdown-item" onClick={handleLogout}>
                  <LogOut size={16} aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="round-btn glass menu-btn"
            onClick={() => {
              setMenuOpen((o) => !o)
              setAccountOpen(false)
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Phones only: a glass sheet with the links and Logout */}
      {menuOpen && (
        <nav id="mobile-menu" className="mobile-sheet glass" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="sheet-link" onClick={closeMenus}>
              <span className="nav-dot" aria-hidden="true" />
              {l.label}
            </NavLink>
          ))}
          <button type="button" className="sheet-link sheet-logout" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            Log out ({user.username})
          </button>
        </nav>
      )}
    </header>
  )
}
