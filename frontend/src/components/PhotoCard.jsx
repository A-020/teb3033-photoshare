import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import Avatar from './Avatar'

// One photo in the feed grid. The image src is the pre-signed S3 URL
// from the API, so the browser loads it straight from the private bucket.
export default function PhotoCard({ photo }) {
  const count = photo.comment_count ?? 0

  return (
    <Link to={`/photos/${photo.id}`} className="photo-card glass">
      <div className="photo-frame">
        <img src={photo.url} alt={photo.caption || `Photo by ${photo.username}`} loading="lazy" />
      </div>
      <div className="photo-card-body">
        <div className="photo-author">
          <Avatar name={photo.username} size={28} />
          <span className="author-name">{photo.username}</span>
          <span className="faint-label">{photo.group_name}</span>
        </div>
        {photo.caption && <p className="caption clamp-2">{photo.caption}</p>}
        {photo.tags.length > 0 && (
          <div className="tags">
            {photo.tags.map((t) => (
              <span key={t} className="pill">#{t}</span>
            ))}
          </div>
        )}
        <div className="photo-foot">
          <span>{new Date(photo.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="comment-count">
            <MessageCircle size={15} aria-hidden="true" />
            {count}
            <span className="sr-only"> {count === 1 ? 'comment' : 'comments'}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
