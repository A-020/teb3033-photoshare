import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import GroupSelect from '../components/GroupSelect'
import useGroups from '../hooks/useGroups'
import { getSelectedGroup, setSelectedGroup } from '../selectedGroup'

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
      <div className="card narrow">
        <h1>Upload photo</h1>
        <p>Photos are shared inside a group. <Link to="/groups">Create or join a group</Link> first.</p>
      </div>
    )
  }

  return (
    <form className="card narrow upload-form" onSubmit={handleSubmit}>
      <h1>Upload photo</h1>

      <label>
        Photo
        <input type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFile} />
        <span className="hint">JPEG, PNG or WebP, up to 5 MB</span>
      </label>
      {preview && <img className="upload-preview" src={preview} alt="Preview" />}

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

      {groupsError && <p className="error">{groupsError}</p>}
      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn" disabled={uploading || !file || !effectiveGroup}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  )
}
