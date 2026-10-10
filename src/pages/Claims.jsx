import { useEffect, useState } from 'react'
import { createClaim, myClaims, resendOtp, verifyOtp } from '../api.js'

const STATUS_LABEL = {
  PENDING_OTP: 'Falta verificar OTP',
  PENDING: 'En revisión',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  FLAGGED: 'Marcado como sospechoso',
}

export default function Claims() {
  const [claims, setClaims] = useState([])
  const [form, setForm] = useState({ reportId: '', description: '', contactPhone: '' })
  const [pending, setPending] = useState(null)   // reclamo esperando OTP
  const [code, setCode] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const load = () => myClaims().then(setClaims).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    try {
      const res = await createClaim(form)
      setPending(res.claim)
      setDevOtp(res.devOtp)        // solo desarrollo
      setForm({ reportId: '', description: '', contactPhone: '' })
      load()
    } catch (err) { setError(err.message) }
  }

  const confirm = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    try {
      await verifyOtp(pending.id, code)
      setInfo('¡OTP verificado! Tu reclamo quedó en revisión.')
      setPending(null); setCode(''); setDevOtp('')
      load()
    } catch (err) { setError(err.message) }
  }

  const resend = async () => {
    try { const r = await resendOtp(pending.id); setDevOtp(r.devOtp); setInfo('OTP reenviado') }
    catch (err) { setError(err.message) }
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      {info && <p className="ok">{info}</p>}

      {pending ? (
        <form className="card" onSubmit={confirm}>
          <h2>Verifica tu reclamo</h2>
          <p>Ingresa el código de 6 dígitos que te enviamos.</p>
          {devOtp && <p className="dev">[DEV] OTP: <b>{devOtp}</b></p>}
          <input inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} required />
          <div className="row">
            <button type="submit">Verificar</button>
            <button type="button" className="link" onClick={resend}>Reenviar código</button>
          </div>
        </form>
      ) : (
        <form className="card" onSubmit={submit}>
          <h2>Nuevo reclamo</h2>
          <input placeholder="ID del reporte" value={form.reportId} onChange={set('reportId')} required />
          <textarea placeholder="Describe por qué el objeto es tuyo (marcas, contenido, rayones...)" rows={4} value={form.description} onChange={set('description')} required />
          <input placeholder="Teléfono de contacto" value={form.contactPhone} onChange={set('contactPhone')} required />
          <button type="submit">Enviar reclamo</button>
        </form>
      )}

      <h2>Mis reclamos</h2>
      {claims.length === 0 && <p>Aún no tienes reclamos.</p>}
      {claims.map((c) => (
        <div className="card" key={c.id}>
          <div className="row between">
            <b>Reporte {c.reportId}</b>
            <span className={`badge ${c.status}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
          </div>
          <p>{c.description}</p>
          <small>{new Date(c.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </>
  )
}
