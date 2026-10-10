import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { auth } from './api.js'
import Login from './pages/Login.jsx'
import Claims from './pages/Claims.jsx'
import Metrics from './pages/Metrics.jsx'
import Placeholder from './pages/Placeholder.jsx'

function Protected({ children }) {
  return auth.token ? children : <Navigate to="/login" replace />
}

function Shell({ children }) {
  const navigate = useNavigate()
  const logout = () => { auth.token = null; navigate('/login') }
  return (
    <>
      <header className="nav">
        <strong>🎒 Objetos Perdidos</strong>
        <nav>
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/recommendations">Recomendaciones</NavLink>
          <NavLink to="/notifications">Notificaciones</NavLink>
          <NavLink to="/claims">Reclamos</NavLink>
          <NavLink to="/metrics">Métricas</NavLink>
        </nav>
        <button className="link" onClick={logout}>Salir</button>
      </header>
      <main className="container">{children}</main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/claims" replace />} />
      {/* Cada integrante reemplaza su Placeholder por su pantalla */}
      <Route path="/feed" element={<Protected><Shell><Placeholder title="Feed de reportes" owner="Persona 2" /></Shell></Protected>} />
      <Route path="/recommendations" element={<Protected><Shell><Placeholder title="Recomendaciones" owner="Persona 3" /></Shell></Protected>} />
      <Route path="/notifications" element={<Protected><Shell><Placeholder title="Notificaciones" owner="Persona 3" /></Shell></Protected>} />
      <Route path="/claims" element={<Protected><Shell><Claims /></Shell></Protected>} />
      <Route path="/metrics" element={<Protected><Shell><Metrics /></Shell></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
