import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Password field with a show/hide eye button.
// The visibility toggle is display state only. The value and onChange
// come from the parent form unchanged.
export default function PasswordInput(props) {
  const [show, setShow] = useState(false)

  return (
    <div className="input-with-button">
      <input {...props} type={show ? 'text' : 'password'} />
      <button
        type="button"
        className="input-icon-btn"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  )
}
