import { Camera, Lock, MessagesSquare, MonitorSmartphone, Search, Users } from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Private friend groups', text: 'Only members see the photos' },
  { icon: Lock, title: 'Secure photo storage', text: 'Private bucket, signed links' },
  { icon: MessagesSquare, title: 'Comments in real time', text: 'New comments every 10 seconds' },
  { icon: Search, title: 'Search by tag or keyword', text: 'Filter by date and uploader' },
  { icon: MonitorSmartphone, title: 'Works on any device', text: 'Phone, tablet and desktop' },
]

// Landing screen for Login and Register: hero headline on the left,
// the form in a tall glass card on the right and a feature strip below.
export default function AuthLayout({ children }) {
  return (
    <div className="auth-screen">
      <div className="backdrop-boost" aria-hidden="true" />

      <div className="brand auth-brand">
        <Camera size={22} aria-hidden="true" />
        PhotoShare
      </div>

      <div className="auth-main">
        <div className="auth-hero">
          <h1 className="hero-title">
            Your moments,
            <br />
            shared with your people.
          </h1>
          <p className="hero-sub">
            Private photo sharing for friend groups. Upload, comment and find any photo in seconds.
          </p>
        </div>

        <div className="auth-card glass">
          <span className="card-handle" aria-hidden="true" />
          {children}
        </div>
      </div>

      <ul className="feature-strip">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Icon size={22} strokeWidth={1.25} aria-hidden="true" />
            <span className="feature-title">{title}</span>
            <span className="feature-text">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
