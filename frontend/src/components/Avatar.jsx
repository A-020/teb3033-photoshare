// Round glass badge showing the first letter of the username
export default function Avatar({ name = '', size = 32 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase() || '?'}
    </span>
  )
}
