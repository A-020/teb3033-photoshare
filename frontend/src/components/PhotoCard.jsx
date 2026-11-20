import { Link } from 'react-router-dom'

// One photo in the feed grid. The image src is the pre-signed S3 URL
// from the API, so the browser loads it straight from the private bucket.
export default function PhotoCard({ photo }) {
  const count = photo.comment_count ?? 0

  return (
    <Link to={`/photos/${photo.id}`} className="photo-card">
      <img src={photo.url} alt={photo.caption || 'Photo'} loading="lazy" />
      <div className="photo-card-body">
        <div className="photo-meta">
          <strong>{photo.username}</strong>
          <span className="muted">{photo.group_name}</span>
        </div>
        {photo.caption && <p className="caption">{photo.caption}</p>}
        {photo.tags.length > 0 && (
          <div className="tags">
            {photo.tags.map((t) => (
              <span key={t} className="tag">#{t}</span>
            ))}
          </div>
        )}
        <div className="photo-meta muted">
          <span>{new Date(photo.created_at).toLocaleString()}</span>
          <span>{count} {count === 1 ? 'comment' : 'comments'}</span>
        </div>
      </div>
    </Link>
  )
}
