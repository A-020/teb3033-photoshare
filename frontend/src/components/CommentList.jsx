import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api'
import { useAuth } from '../context/AuthContext'

const MAX_LENGTH = 1000
const REFRESH_MS = 10000 // other users' comments appear without a reload

// photoOwnerId: the photo owner may delete any comment on their photo
export default function CommentList({ photoId, photoOwnerId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/photos/${photoId}/comments`)
      setComments(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load comments'))
    } finally {
      setLoading(false)
    }
  }, [photoId])

  // Load now, then refresh every 10 seconds while the page is open
  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  async function addComment(e) {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    setError('')
    setPosting(true)
    try {
      const { data } = await api.post(`/photos/${photoId}/comments`, { content: text })
      // Append the new comment, unless a refresh already brought it in
      setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]))
      setContent('')
    } catch (err) {
      setError(errorMessage(err, 'Could not post comment'))
    } finally {
      setPosting(false)
    }
  }

  function startEdit(c) {
    setEditingId(c.id)
    setEditText(c.content)
    setError('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    const text = editText.trim()
    if (!text) return
    setSaving(true)
    try {
      const { data } = await api.put(`/comments/${editingId}`, { content: text })
      setComments((prev) => prev.map((c) => (c.id === data.id ? data : c)))
      setEditingId(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not save comment'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteComment(id) {
    if (!window.confirm('Delete this comment?')) return
    setError('')
    try {
      await api.delete(`/comments/${id}`)
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(errorMessage(err, 'Could not delete comment'))
    }
  }

  return (
    <section className="comments">
      <h2>Comments ({comments.length})</h2>

      {loading && <p className="muted">Loading comments...</p>}
      {!loading && comments.length === 0 && <p className="muted">No comments yet.</p>}

      <ul className="comment-list">
        {comments.map((c) => {
          // Edit: author only. Delete: author or photo owner.
          // The server enforces the same rules in SQL.
          const mine = c.user_id === user.id
          const canDelete = mine || photoOwnerId === user.id
          const edited = c.updated_at !== c.created_at
          return (
            <li key={c.id} className="comment">
              <div className="comment-head">
                <strong>{c.username}</strong>
                <span className="muted">
                  {new Date(c.created_at).toLocaleString()}
                  {edited && ' (edited)'}
                </span>
              </div>

              {editingId === c.id ? (
                <form onSubmit={saveEdit} className="comment-edit">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={MAX_LENGTH} rows={2} autoFocus />
                  <div className="row">
                    <button type="submit" className="btn btn-small" disabled={saving || !editText.trim()}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className="comment-body">{c.content}</p>
              )}

              {canDelete && editingId !== c.id && (
                <div className="row">
                  {mine && (
                    <button type="button" className="link-btn" onClick={() => startEdit(c)}>Edit</button>
                  )}
                  <button type="button" className="link-btn danger" onClick={() => deleteComment(c.id)}>Delete</button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {error && <p className="error">{error}</p>}

      <form onSubmit={addComment} className="comment-form">
        <textarea
          placeholder="Write a comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={2}
        />
        <div className="row space-between">
          <span className="hint">{content.length}/{MAX_LENGTH}</span>
          <button type="submit" className="btn" disabled={posting || !content.trim()}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </section>
  )
}
