// Dropdown of the user's groups. With includeAll, the first option is
// "All my groups" (empty value), used by the feed.
export default function GroupSelect({ groups, value, onChange, includeAll = false, id }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAll && <option value="">All my groups</option>}
      {groups.map((g) => (
        <option key={g.id} value={String(g.id)}>
          {g.name}
        </option>
      ))}
    </select>
  )
}
