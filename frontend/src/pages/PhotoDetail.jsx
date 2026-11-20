import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { useAuth } from '../context/AuthContext'
import CommentList from '../components/CommentList'

export default function PhotoDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let ignore = false
    setPhoto(null)
    setError('')
    api
      .get(`/photos/${id}`)
      .then(({ data }) => {
        if (!ignore) setPhoto(data)
      })
      .catch((err) => {
        // 403 for non-members, 404 for a missing photo
        if (!ignore) setError(errorMessage(err, 'Could not load photo'))
      })
    return () => {
      ignore = true
    }
  }, [id])

  async function deletePhoto() {
    if (!window.confirm('Delete this photo? Its comments are deleted too.')) return
    setDeleting(true)
    try {
      await api.delete(`/photos/${id}`)
      navigate(`/?groupId=${photo.group_id}`)
    } catch (err) {
      setError(errorMessage(err, 'Could not delete photo'))
      setDeleting(false)
    }
  }

  if (error && !photo) {
    return (
      <div className="card narrow">
        <p className="error">{error}</p>
        <Link to="/">Back to feed</Link>
      </div>
    )
  }
  if (!photo) return <p className="muted">Loading photo...</p>

  return (
    <div className="detail">
      <Link to={`/?groupId=${photo.group_id}`} className="muted">&larr; Back to {photo.group_name}</Link>

      <div className="card detail-card">
        <img className="detail-image" src={photo.url} alt={photo.caption || 'Photo'} />
        <div className="detail-info">
          <div className="photo-meta">
            <div>
              <strong>{photo.username}</strong>
              <span className="muted"> in {photo.group_name}</span>
            </div>
            <span className="muted">{new Date(photo.created_at).toLocaleString()}</span>
          </div>
          {photo.caption && <p className="caption">{photo.caption}</p>}
          {photo.tags.length > 0 && (
            <div className="tags">
              {photo.tags.map((t) => (
                <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="tag">#{t}</Link>
              ))}
            </div>
          )}
          {error && <p className="error">{error}</p>}
          {/* Only the owner sees Delete. The server checks ownership again. */}
          {photo.user_id === user.id && (
            <button type="button" className="btn btn-danger btn-small" onClick={deletePhoto} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete photo'}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <CommentList photoId={photo.id} photoOwnerId={photo.user_id} />
      </div>
    </div>
  )
}
