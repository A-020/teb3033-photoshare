import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps every page that needs a logged-in user.
// Without a user it redirects to /login and remembers where the user was going.
// This only improves the experience. The real guard is the JWT check on the server.
export default function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
