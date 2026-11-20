// Large thin icon, one light line of text and an optional action (usually a coral button)
export default function EmptyState({ icon: Icon, text, children }) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-icon" size={48} strokeWidth={1.1} aria-hidden="true" />}
      <p>{text}</p>
      {children}
    </div>
  )
}
