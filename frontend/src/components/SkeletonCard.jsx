// Placeholder card with a soft shimmer, shown while the feed loads
export default function SkeletonCard() {
  return (
    <div className="photo-card glass skeleton-card" aria-hidden="true">
      <div className="photo-frame skeleton" />
      <div className="photo-card-body">
        <div className="row">
          <span className="skeleton skeleton-circle" />
          <span className="skeleton skeleton-line" style={{ width: '40%' }} />
        </div>
        <span className="skeleton skeleton-line" style={{ width: '90%' }} />
        <span className="skeleton skeleton-line" style={{ width: '60%' }} />
      </div>
    </div>
  )
}
