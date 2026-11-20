import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import GroupSelect from '../components/GroupSelect'
import useGroups from '../hooks/useGroups'
import { getSelectedGroup, setSelectedGroup } from '../selectedGroup'
import { ArrowUpRight, ImagePlus, Upload as UploadIcon, Users } from 'lucide-react'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'

// Same limits as the server. The client check gives quick feedback,
// but the server check (multer) remains the real guard.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export default function Upload() {
  const navigate = useNavigate()
  const { groups, loading: groupsLoading, error: groupsError } = useGroups()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [groupId, setGroupId] = useState(getSelectedGroup())
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  // Use the chosen group if the user is in it, otherwise the first group
  const validGroup = groups.some((g) => String(g.id) === groupId)
  const effectiveGroup = validGroup ? groupId : groups[0] ? String(groups[0].id) : ''

  // Local preview of the chosen file. The object URL is released afterwards.
  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFile(e) {
    const f = e.target.files[0]
    setError('')
    if (!f) {
      setFile(null)
      return
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only JPEG, PNG or WebP images are allowed')
      e.target.value = ''
      setFile(null)
      return
    }
    if (f.size > MAX_BYTES) {
      setError('File too large (max 5 MB)')
      e.target.value = ''
      setFile(null)
      return
    }
    setFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) {
      setError('Choose a photo first')
      return
    }
    setError('')
    setUploading(true)

    // FormData makes a multipart request. The browser sets the
    // Content-Type header with the boundary, so we do not set it ourselves.
    const form = new FormData()
    form.append('photo', file)
    form.append('caption', caption)
    form.append('groupId', effectiveGroup)
    form.append('tags', tags) // "beach,trip"

    try {
      await api.post('/photos', form)
      setSelectedGroup(effectiveGroup)
      navigate(`/?groupId=${effectiveGroup}`)
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'))
      setUploading(false)
    }
  }

  if (!groupsLoading && !groupsError && groups.length === 0) {
    return (
      <div className="narrow stack-lg">
        <PageHeader title="Upload photo" subtitle="Share a photo with one of your groups." />
        <div className="glass panel">
          <EmptyState icon={Users} text="Photos are shared inside a group. Create or join a group first.">
            <Link to="/groups" className="btn btn-primary">
              Go to Groups
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </EmptyState>
        </div>
      </div>
    )
  }

  return (
    <div className="narrow stack-lg">
      <PageHeader title="Upload photo" subtitle="Share a photo with one of your groups." />
      <form className="glass panel upload-form" onSubmit={handleSubmit}>
        {/* The real file input stays in the page (visually hidden but focusable).
            The drop zone and "Change photo" are labels that open it. */}
        <input
          id="photo-input"
          className="sr-only file-input"
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFile}
        />
        {preview ? (
          <div className="upload-preview-wrap">
            <img className="upload-preview" src={preview} alt="Preview of the chosen photo" />
            <label htmlFor="photo-input" className="btn-link change-photo">
              <ImagePlus size={16} aria-hidden="true" />
              Change photo
            </label>
          </div>
        ) : (
          <label htmlFor="photo-input" className="dropzone">
            <span className="dropzone-icon">
              <UploadIcon size={26} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="dropzone-title">Choose a photo</span>
            <span className="hint">(JPG, PNG or WebP, up to 5 MB)</span>
          </label>
        )}

        <label>
          Group
          <GroupSelect groups={groups} value={effectiveGroup} onChange={setGroupId} />
        </label>

        <label>
          Caption
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} rows={3} />
        </label>

        <label>
          Tags
          <input placeholder="beach, trip" value={tags} onChange={(e) => setTags(e.target.value)} />
          <span className="hint">Separate tags with commas</span>
        </label>

        {groupsError && <Alert>{groupsError}</Alert>}
        {error && <Alert>{error}</Alert>}

        <button type="submit" className="btn btn-primary btn-block" disabled={uploading || !file || !effectiveGroup}>
          {uploading ? <><Spinner /> Uploading...</> : <>Upload <ArrowUpRight size={16} aria-hidden="true" /></>}
        </button>
      </form>
    </div>
  )
}
