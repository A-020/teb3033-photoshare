import { createContext, useContext, useState } from 'react'
import api from '../api'

// Holds the current user and exposes login(), register() and logout().
// The token and user are kept in localStorage, so a page refresh keeps
// the user logged in. The server stays stateless: the token is the session.
const AuthContext = createContext(null)

function loadUser() {
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    return token && user ? user : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  // Creates the account, then logs in straight away
  async function register(username, email, password) {
    await api.post('/auth/register', { username, email, password })
    await login(email, password)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('groupId')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
