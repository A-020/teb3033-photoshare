import { CircleAlert, CircleCheck } from 'lucide-react'

// Feedback box: a glass panel with a coloured left border.
// type="error" uses red, type="success" uses green.
// role="alert" makes screen readers announce errors.
export default function Alert({ type = 'error', children }) {
  const Icon = type === 'success' ? CircleCheck : CircleAlert
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
