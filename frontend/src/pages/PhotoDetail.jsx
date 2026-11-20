import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { useAuth } from '../context/AuthContext'
import CommentList from '../components/CommentList'
import { ArrowLeft, ArrowUpRight, ImageOff, Trash2 } from 'lucide-react'
import Alert from '../components/Alert'
import Avatar from '../components/Avatar'
import BackdropDim from '../components/BackdropDim'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'

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
      <div className="narrow stack-lg">
        <BackdropDim />
        <PageHeader title="Photo" subtitle="This photo could not be opened." />
        <div className="glass panel">
          <EmptyState icon={ImageOff} text={error}>
            <Link to="/" className="btn btn-primary">
              Back to feed
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </EmptyState>
        </div>
      </div>
    )
  }
  if (!photo) {
    return (
      <>
        <BackdropDim />
        <p className="loading"><Spinner /> Loading photo...</p>
      </>
    )
  }

  return (
    <div className="stack">
      <BackdropDim />

      <Link to={`/?groupId=${photo.group_id}`} className="btn-link back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to {photo.group_name}
      </Link>

      <div className="detail-layout">
        {/* Left: the large image in a glass frame */}
        <div className="detail-frame glass">
          <img className="detail-image" src={photo.url} alt={photo.caption || `Photo by ${photo.username}`} />
        </div>

        {/* Right: a tall glass panel with the details, then the comments */}
        <aside className="detail-panel glass">
          <div className="detail-info">
            <div className="detail-author">
              <Avatar name={photo.username} size={40} />
              <div>
                <strong>{photo.username}</strong>
                <span className="muted">in {photo.group_name}</span>
              </div>
            </div>
            <span className="faint-label">{new Date(photo.created_at).toLocaleString()}</span>
            {photo.caption && <p className="caption">{photo.caption}</p>}
            {photo.tags.length > 0 && (
              <div className="tags">
                {photo.tags.map((t) => (
                  <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="pill pill-link">#{t}</Link>
                ))}
              </div>
            )}
            {error && <Alert>{error}</Alert>}
            {/* Only the owner sees Delete. The server checks ownership again. */}
            {photo.user_id === user.id && (
              <button type="button" className="btn btn-danger" onClick={deletePhoto} disabled={deleting}>
                {deleting ? <><Spinner /> Deleting...</> : <><Trash2 size={16} aria-hidden="true" /> Delete photo</>}
              </button>
            )}
          </div>

          <CommentList photoId={photo.id} photoOwnerId={photo.user_id} />
        </aside>
      </div>
    </div>
  )
}
