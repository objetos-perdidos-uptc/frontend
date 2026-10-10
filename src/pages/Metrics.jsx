import { useEffect, useState } from 'react'
import { claimMetrics } from '../api.js'

const LABELS = {
  total: 'Total de reclamos',
  pending_otp: 'Esperando OTP',
  pending: 'En revisión',
  approved: 'Aprobados',
  rejected: 'Rechazados',
  flagged: 'Sospechosos',
  approvalRate: 'Tasa de aprobación (%)',
  fraudRate: 'Tasa de fraude (%)',
}

export default function Metrics() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { claimMetrics().then(setData).catch((e) => setError(e.message)) }, [])

  if (error) return <p className="error">{error}</p>
  if (!data) return <p>Cargando…</p>

  return (
    <>
      <h2>Métricas de reclamos</h2>
      <div className="grid">
        {Object.entries(LABELS).map(([k, label]) => (
          <div className="card stat" key={k}>
            <span>{label}</span>
            <strong>{data[k] ?? 0}</strong>
          </div>
        ))}
      </div>
    </>
  )
}
