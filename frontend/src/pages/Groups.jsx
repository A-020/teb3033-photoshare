import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api'
import useGroups from '../hooks/useGroups'
import { getSelectedGroup, setSelectedGroup } from '../selectedGroup'
import { ArrowUpRight, MousePointerClick, UserPlus, Users } from 'lucide-react'
import Alert from '../components/Alert'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'

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
    <div>
      <PageHeader title="Groups" subtitle="Create a group and add friends to share photos with them." />

      <div className="groups-layout">
        <section className="stack">
          <form className="glass panel stack" onSubmit={createGroup}>
            <h2>New group</h2>
            <label>
              Group name
              <div className="inline-form">
                <input
                  placeholder="For example: Class trip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><Spinner /> Creating...</> : <>Create <ArrowUpRight size={16} aria-hidden="true" /></>}
                </button>
              </div>
            </label>
            {createError && <Alert>{createError}</Alert>}
          </form>

          <div className="stack">
            <h2 className="section-title">My groups</h2>
            {loading && <p className="loading"><Spinner /> Loading groups...</p>}
            {error && <Alert>{error}</Alert>}
            {!loading && !error && groups.length === 0 && (
              <div className="glass panel">
                <EmptyState icon={Users} text="You are not in any group yet. Create one above." />
              </div>
            )}

            {groups.length > 0 && (
              <ul className="group-list">
                {groups.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className={`group-item glass ${String(g.id) === selectedId ? 'active' : ''}`}
                      onClick={() => select(g.id)}
                      aria-pressed={String(g.id) === selectedId}
                    >
                      <span className="group-name">{g.name}</span>
                      <span className="pill">
                        {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          {selected ? (
            // key resets the panel state when another group is chosen
            <GroupMembers key={selected.id} group={selected} onMembersChanged={reload} />
          ) : (
            <div className="glass panel">
              <EmptyState icon={MousePointerClick} text="Select a group to see its members." />
            </div>
          )}
        </section>
      </div>
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
    <div className="glass panel stack">
      <div className="panel-header">
        <h2>{group.name}</h2>
        <Link to={`/?groupId=${group.id}`} className="btn-link">
          View photos
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div>
        <h3>Members</h3>
        {loading ? (
          <p className="loading"><Spinner /> Loading members...</p>
        ) : (
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.id}>
                <span className="member-name">
                  <Avatar name={m.username} size={28} />
                  {m.username}
                </span>
                <span className="muted">joined {new Date(m.joined_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="stack" onSubmit={addMember}>
        <label>
          Add a friend
          <div className="inline-form">
            <input
              placeholder="Friend's username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? <><Spinner /> Adding...</> : <><UserPlus size={16} aria-hidden="true" /> Add <ArrowUpRight size={16} aria-hidden="true" /></>}
            </button>
          </div>
        </label>
        {notice && <Alert type="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}
      </form>
    </div>
  )
}
