import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { errorMessage } from '../api'
import PhotoCard from '../components/PhotoCard'
import SearchBar from '../components/SearchBar'
import { FILTER_KEYS } from '../filters'
import GroupSelect from '../components/GroupSelect'
import useGroups from '../hooks/useGroups'
import { getSelectedGroup, setSelectedGroup } from '../selectedGroup'
import { ArrowUpRight, ImageOff, SearchX } from 'lucide-react'
import Alert from '../components/Alert'
import BackdropDim from '../components/BackdropDim'
import SkeletonCard from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'

const PAGE_SIZE = 12

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { groups } = useGroups()
  const [photos, setPhotos] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const groupId = searchParams.get('groupId') || ''
  const query = searchParams.toString()
  const latestQuery = useRef(query)

  // Opening the feed without a group in the URL: jump to the remembered group
  const remembered = getSelectedGroup()
  const needsRedirect = !searchParams.has('groupId') && Boolean(remembered)

  useEffect(() => {
    if (needsRedirect) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('groupId', remembered)
        return next
      }, { replace: true })
    }
  }, [needsRedirect, remembered, setSearchParams])

  // Load the first page whenever the URL filters change
  useEffect(() => {
    if (needsRedirect) return
    latestQuery.current = query
    let ignore = false // drops a slow response if the filters changed meanwhile
    setLoading(true)
    setError('')
    const params = Object.fromEntries(new URLSearchParams(query))
    api
      .get('/photos', { params: { ...params, limit: PAGE_SIZE, offset: 0 } })
      .then(({ data }) => {
        if (ignore) return
        setPhotos(data.photos)
        setHasMore(data.photos.length === PAGE_SIZE)
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err, 'Could not load photos'))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [query, needsRedirect])

  // Next page, using ?offset= from the API
  async function loadMore() {
    const startedWith = query
    setLoadingMore(true)
    try {
      const params = Object.fromEntries(new URLSearchParams(query))
      const { data } = await api.get('/photos', {
        params: { ...params, limit: PAGE_SIZE, offset: photos.length },
      })
      if (latestQuery.current !== startedWith) return
      setPhotos((prev) => [...prev, ...data.photos])
      setHasMore(data.photos.length === PAGE_SIZE)
    } catch (err) {
      setError(errorMessage(err, 'Could not load more photos'))
    } finally {
      setLoadingMore(false)
    }
  }

  function changeGroup(id) {
    setSelectedGroup(id)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id) next.set('groupId', id)
      else next.delete('groupId')
      return next
    })
  }

  function clearFilters() {
    setSearchParams(groupId ? { groupId } : {})
  }

  const filtersActive = FILTER_KEYS.some((k) => searchParams.get(k))

  return (
    <div className="stack-lg">
      <BackdropDim />

      <PageHeader title="Feed" subtitle="Photos shared in your groups, newest first.">
        <label className="header-field">
          <span className="field-label">Group</span>
          <GroupSelect groups={groups} value={groupId} onChange={changeGroup} includeAll />
        </label>
        <Link to="/upload" className="btn btn-primary">
          Upload photo
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </PageHeader>

      <SearchBar />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="photo-grid" aria-busy="true">
          <span className="sr-only">Loading photos...</span>
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="glass panel">
          {filtersActive ? (
            <EmptyState icon={SearchX} text="No photos match.">
              <button type="button" className="btn btn-primary" onClick={clearFilters}>
                Clear filters
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </EmptyState>
          ) : (
            <EmptyState icon={ImageOff} text="No photos yet.">
              <Link to="/upload" className="btn btn-primary">
                Upload a photo
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </EmptyState>
          )}
        </div>
      ) : (
        <>
          <div className="photo-grid">
            {photos.map((p) => (
              <PhotoCard key={p.id} photo={p} />
            ))}
          </div>
          {hasMore && (
            <div className="center">
              <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <><Spinner /> Loading...</> : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
