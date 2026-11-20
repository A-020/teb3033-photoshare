import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import { ArrowUpRight } from 'lucide-react'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setBusy(true)
    try {
      // Registers, then logs in, then opens the feed
      await register(username.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      // For example "Username or email already taken" (409)
      setError(errorMessage(err, 'Registration failed'))
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <h2 className="auth-title">Create account</h2>
          <p className="muted">Join PhotoShare and share photos with your friend groups.</p>
        </div>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} required autoFocus />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} required />
        </label>
        <label>
          Password
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          <span className="hint">At least 8 characters</span>
        </label>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <><Spinner /> Creating account...</> : <>Register <ArrowUpRight size={16} aria-hidden="true" /></>}
        </button>
        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
