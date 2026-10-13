import { useState } from 'react'
import { myFoundCandidates, myRecommendations, myReports } from '../api.js'

const fmtScore = (s) => `${Number(s).toFixed(1)}%`

function ScoreBadge({ score }) {
  const cls = score >= 80 ? 'approved' : score >= 50 ? 'pending' : 'rejected'
  return <span className={`badge ${cls}`}>{fmtScore(score)}</span>
}

export default function Recommendations() {
  const [reportId, setReportId] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mine, setMine] = useState(null)

  // Carga rápida de mis reportes para dar ideas
  if (mine === null) {
    myReports().then(setMine).catch(() => setMine([]))
  }

  const search = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true); setResults(null)
    try {
      const id = Number(reportId)
      if (!Number.isInteger(id) || id <= 0) throw new Error('Ingresa un ID válido')
      // Ambos endpoints por si el usuario no sabe de qué tipo es el reporte
      const [lost, found] = await Promise.allSettled([
        myRecommendations(id, minScore),
        myFoundCandidates(id, minScore),
      ])
      const r = lost.status === 'fulfilled' && lost.value.length > 0
        ? { direction: 'LOST → FOUND', items: lost.value }
        : found.status === 'fulfilled' && found.value.length > 0
          ? { direction: 'FOUND → LOST', items: found.value }
          : { direction: null, items: [] }
      setResults(r)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <>
      {error && <p className="error">{error}</p>}

      <form className="card" onSubmit={search}>
        <h2>Buscar recomendaciones</h2>
        <p>Ingresa el ID de un reporte tuyo para ver objetos que podrían coincidir.</p>
        <div className="row">
          <input
            placeholder="ID del reporte (ej. 1)"
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            required
          />
          <input
            type="number"
            min="0" max="100"
            placeholder="Score mínimo"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {mine?.length > 0 && (
          <small>
            Tus reportes: {mine.map((r) => `#${r.reportId}`).join(', ')}
          </small>
        )}
      </form>

      {results && (
        <>
          <h2>
            {results.items.length === 0
              ? 'Sin recomendaciones'
              : `${results.items.length} recomendación(es) · ${results.direction}`}
          </h2>
          {results.items.length === 0 && (
            <p>No hay candidatos con score ≥ {minScore}. Prueba bajando el mínimo.</p>
          )}
          {results.items.map((c) => (
            <div className="card" key={c.reportId}>
              <div className="row between">
                <b>#{c.reportId} · {c.name}</b>
                <ScoreBadge score={c.score} />
              </div>
              <small>
                Categoría #{c.categoryId} · Publicado {new Date(c.date).toLocaleDateString()}
              </small>
              {c.photo && <small>📷 {c.photo}</small>}
            </div>
          ))}
        </>
      )}
    </>
  )
}
