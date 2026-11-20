import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Groups from './pages/Groups'
import Feed from './pages/Feed'
import Upload from './pages/Upload'
import PhotoDetail from './pages/PhotoDetail'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="container">
          <Routes>
            {/* Public pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Pages that need a logged-in user */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Feed />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/photos/:id" element={<PhotoDetail />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}
