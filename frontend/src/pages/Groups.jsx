import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api'
import useGroups from '../hooks/useGroups'
import { getSelectedGroup, setSelectedGroup } from '../selectedGroup'

export default function Groups() {
  const { groups, loading, error, reload } = useGroups()
  const [selectedId, setSelectedId] = useState(getSelectedGroup())
  const [name, setName] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const selected = groups.find((g) => String(g.id) === selectedId)

  // Selecting a group also remembers it for the Feed and Upload pages
  function select(id) {
    setSelectedId(String(id))
    setSelectedGroup(id)
  }

  async function createGroup(e) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const { data } = await api.post('/groups', { name: name.trim() })
      setName('')
      await reload()
      select(data.id)
    } catch (err) {
      setCreateError(errorMessage(err, 'Could not create group'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="groups-layout">
      <section>
        <h1>My groups</h1>

        <form className="card inline-form" onSubmit={createGroup}>
          <input
            placeholder="New group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
          <button type="submit" className="btn" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
        {createError && <p className="error">{createError}</p>}

        {loading && <p className="muted">Loading groups...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && groups.length === 0 && (
          <p className="muted">You are not in any group yet. Create one above.</p>
        )}

        <ul className="group-list">
          {groups.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className={`group-item ${String(g.id) === selectedId ? 'active' : ''}`}
                onClick={() => select(g.id)}
              >
                <span>{g.name}</span>
                <span className="muted">
                  {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        {selected ? (
          // key resets the panel state when another group is chosen
          <GroupMembers key={selected.id} group={selected} onMembersChanged={reload} />
        ) : (
          <p className="muted panel-placeholder">Select a group to see its members.</p>
        )}
      </section>
    </div>
  )
}

// Members of one group and a form to add a friend by username
function GroupMembers({ group, onMembersChanged }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')

  const loadMembers = useCallback(async () => {
    try {
      const { data } = await api.get(`/groups/${group.id}/members`)
      setMembers(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load members'))
    } finally {
      setLoading(false)
    }
  }, [group.id])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  async function addMember(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setAdding(true)
    try {
      const { data } = await api.post(`/groups/${group.id}/members`, { username: username.trim() })
      setNotice(data.message ? `${data.username} is already a member` : `${data.username} added`)
      setUsername('')
      await loadMembers()
      onMembersChanged() // refresh the member count in the list
    } catch (err) {
      setError(errorMessage(err, 'Could not add member'))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="card">
      <div className="panel-header">
        <h2>{group.name}</h2>
        <Link to={`/?groupId=${group.id}`} className="btn btn-small btn-ghost">
          View photos
        </Link>
      </div>

      <h3>Members</h3>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id}>
              <span>{m.username}</span>
              <span className="muted">joined {new Date(m.joined_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}

      <h3>Add a friend</h3>
      <form className="inline-form" onSubmit={addMember}>
        <input
          placeholder="Friend's username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit" className="btn" disabled={adding}>
          {adding ? 'Adding...' : 'Add'}
        </button>
      </form>
      {notice && <p className="success">{notice}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
