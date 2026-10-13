import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, register } from '../api.js'

export default function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        campusId: 1,
        universityId: 1,
    })
    const [error, setError] = useState('')
    const [ok, setOk] = useState('')
    const navigate = useNavigate()

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setOk('')
        try {
            await register(form)
            setOk('¡Registro exitoso! Redirigiendo al login...')
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="container narrow">
            <form className="card" onSubmit={submit}>
                <h2>Crear cuenta</h2>

                <input
                    placeholder="Nombre completo"
                    value={form.name}
                    onChange={set('name')}
                    required
                />
                <input
                    type="email"
                    placeholder="Correo institucional"
                    value={form.email}
                    onChange={set('email')}
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña (mínimo 8 caracteres)"
                    value={form.password}
                    onChange={set('password')}
                    minLength={8}
                    required
                />
                <input
                    type="number"
                    placeholder="ID del campus"
                    value={form.campusId}
                    onChange={set('campusId')}
                    required
                />
                <input
                    type="number"
                    placeholder="ID de la universidad"
                    value={form.universityId}
                    onChange={set('universityId')}
                    required
                />

                {error && <p className="error">{error}</p>}
                {ok && <p className="ok">{ok}</p>}

                <button type="submit">Registrarme</button>

                <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
            </form>
        </div>
    )
}