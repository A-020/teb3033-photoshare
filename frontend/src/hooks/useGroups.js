import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api'

// Loads the user's groups from GET /api/groups.
// Used by the Groups, Feed and Upload pages.
export default function useGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const { data } = await api.get('/groups')
      setGroups(data)
      setError('')
    } catch (err) {
      setError(errorMessage(err, 'Could not load groups'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { groups, loading, error, reload }
}
