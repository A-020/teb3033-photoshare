// Remembers the group the user last chose, so the Feed and Upload pages
// open on that group. An empty value means "All my groups".
// Cleared on logout (see AuthContext).
export function getSelectedGroup() {
  return localStorage.getItem('groupId') || ''
}

export function setSelectedGroup(id) {
  if (id) localStorage.setItem('groupId', String(id))
  else localStorage.removeItem('groupId')
}
