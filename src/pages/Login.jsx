import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, login } from '../api.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login(email, password)
      auth.token = data.token ?? data.accessToken   // ajustar al contrato de auth-service
      navigate('/claims')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container narrow">
      <form className="card" onSubmit={submit}>
        <h2>Iniciar sesión</h2>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}
