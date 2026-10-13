import { useEffect, useState } from 'react'
import {
  closeReport, createReport, myReports, renewReport, reportCategories, reportFeed,
  reportPhotoUrl, uploadReportPhotos,
} from '../api.js'

const TYPE_LABEL = { LOST: 'Perdido', FOUND: 'Encontrado' }
const STATUS_LABEL = { ACTIVE: 'Activo', CLOSED: 'Cerrado', EXPIRED: 'Expirado' }
const EMPTY_FORM = {
  type: 'LOST', name: '', categoryId: '', description: '', color: '', material: '', date: '',
  textDirection: '', latitude: null, longitude: null, privateFeature: '', reward: '', custodyLocation: '',
}
const PAGE_SIZE = 10

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—')

function Photo({ path }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let url
    reportPhotoUrl(path).then((u) => { url = u; setSrc(u) }).catch(() => {})
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [path])
  return src ? <img src={src} alt="Foto del objeto" /> : null
}

function ReportCard({ report, mine = false, actions }) {
  const date = report.type === 'LOST' ? report.dateLost : report.dateOfDiscovery
  return (
    <div className="card">
      <div className="row between">
        <b>#{report.reportId} · {report.name}</b>
        <span className="row">
          <span className={`badge ${report.type}`}>{TYPE_LABEL[report.type]}</span>
          {mine && <span className={`badge ${report.status}`}>{STATUS_LABEL[report.status]}</span>}
        </span>
      </div>
      {report.photos.length > 0 && (
        <div className="thumbs">{report.photos.map((p) => <Photo key={p} path={p} />)}</div>
      )}
      {report.description && <p>{report.description}</p>}
      <small>
        {[report.categoryName, report.color, report.material].filter(Boolean).join(' · ')}
      </small>
      <small>
        {report.type === 'LOST' ? 'Se perdió' : 'Se encontró'} el {formatDate(date)}
        {report.location?.textDirection && ` en ${report.location.textDirection}`}
        {report.custodyLocation && ` · En custodia: ${report.custodyLocation}`}
        {report.reward > 0 && ` · Recompensa: $${report.reward}`}
      </small>
      {mine && report.status === 'ACTIVE' && <small>Expira el {formatDate(report.expirationDate)}</small>}
      {actions}
    </div>
  )
}

function ReportForm({ categories, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const lost = form.type === 'LOST'

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const locate = () => {
    if (!navigator.geolocation) return setError('Tu navegador no permite obtener la ubicación')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((f) => ({ ...f, latitude: coords.latitude, longitude: coords.longitude })),
      () => setError('No se pudo obtener la ubicación'),
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const date = new Date(form.date).toISOString()
      const report = await createReport({
        type: form.type,
        name: form.name,
        categoryId: Number(form.categoryId),
        description: form.description,
        color: form.color,
        material: form.material,
        privateFeature: form.privateFeature,
        location: { latitude: form.latitude, longitude: form.longitude, textDirection: form.textDirection },
        ...(lost
          ? { dateLost: date, reward: form.reward }
          : { dateOfDiscovery: date, custodyLocation: form.custodyLocation }),
      })
      if (files.length > 0) await uploadReportPhotos(report.reportId, files)
      onCreated(`Reporte #${report.reportId} publicado.`)
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Nuevo reporte</h2>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <select value={form.type} onChange={set('type')}>
          <option value="LOST">Perdí un objeto</option>
          <option value="FOUND">Encontré un objeto</option>
        </select>
        <select value={form.categoryId} onChange={set('categoryId')} required>
          <option value="">Categoría…</option>
          {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
        </select>
      </div>
      <input placeholder="¿Qué objeto es? (ej. Mochila azul)" value={form.name} onChange={set('name')} maxLength={120} required />
      <textarea placeholder="Detalles visibles para todos" rows={3} value={form.description} onChange={set('description')} />
      <div className="row">
        <input placeholder="Color" value={form.color} onChange={set('color')} />
        <input placeholder="Material" value={form.material} onChange={set('material')} />
      </div>
      <label>
        {lost ? '¿Cuándo lo perdiste?' : '¿Cuándo lo encontraste?'}
        <input type="datetime-local" value={form.date} onChange={set('date')} required />
      </label>
      <input placeholder="Lugar (ej. Biblioteca central, segundo piso)" value={form.textDirection} onChange={set('textDirection')} />
      <div className="row">
        <button type="button" className="link" onClick={locate}>Usar mi ubicación actual</button>
        {form.latitude !== null && <small className="ok">Ubicación guardada ✓</small>}
      </div>
      <label>
        Característica privada {lost ? '' : '(opcional)'}
        <input
          placeholder="Un detalle que solo conoce el dueño. No se publica."
          value={form.privateFeature} onChange={set('privateFeature')} required={lost}
        />
      </label>
      {lost
        ? <input type="number" min="0" placeholder="Recompensa (opcional)" value={form.reward} onChange={set('reward')} />
        : <input placeholder="¿Dónde quedó en custodia? (opcional)" value={form.custodyLocation} onChange={set('custodyLocation')} />}
      <label>
        Fotos (máximo 5)
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 5))} />
      </label>
      <button type="submit" disabled={saving}>{saving ? 'Publicando…' : 'Publicar reporte'}</button>
    </form>
  )
}

export default function Feed() {
  const [view, setView] = useState('feed')   // feed | mine | new
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ q: '', type: '', categoryId: '' })
  const [page, setPage] = useState(0)
  const [feed, setFeed] = useState(null)
  const [mine, setMine] = useState(null)
  const [mineStatus, setMineStatus] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const fail = (e) => setError(e.message)
  const loadFeed = (p = page, f = filters) =>
    reportFeed({ ...f, page: p, size: PAGE_SIZE }).then(setFeed).catch(fail)
  const loadMine = (status = mineStatus) => myReports(status).then(setMine).catch(fail)

  useEffect(() => { reportCategories().then(setCategories).catch(fail) }, [])
  useEffect(() => {
    setError('')
    if (view === 'feed') loadFeed()
    if (view === 'mine') loadMine()
  }, [view, page, mineStatus])

  const setFilter = (k) => (e) => {
    const next = { ...filters, [k]: e.target.value }
    setFilters(next)
    if (k !== 'q') { setPage(0); loadFeed(0, next) }   // la palabra clave se busca al enviar
  }
  const search = (e) => { e.preventDefault(); setPage(0); loadFeed(0) }

  const act = (fn, message) => async () => {
    setError(''); setInfo('')
    try { await fn(); setInfo(message); loadMine() } catch (e) { fail(e) }
  }

  return (
    <>
      <div className="row tabs">
        <button className={view === 'feed' ? '' : 'link'} onClick={() => setView('feed')}>Feed de mi sede</button>
        <button className={view === 'mine' ? '' : 'link'} onClick={() => setView('mine')}>Mis reportes</button>
        <button className={view === 'new' ? '' : 'link'} onClick={() => setView('new')}>+ Nuevo reporte</button>
      </div>

      {error && <p className="error">{error}</p>}
      {info && <p className="ok">{info}</p>}

      {view === 'feed' && (
        <>
          <form className="card" onSubmit={search}>
            <div className="row">
              <input placeholder="Buscar por palabra clave…" value={filters.q} onChange={setFilter('q')} />
              <button type="submit">Buscar</button>
            </div>
            <div className="row">
              <select value={filters.type} onChange={setFilter('type')}>
                <option value="">Perdidos y encontrados</option>
                <option value="LOST">Solo perdidos</option>
                <option value="FOUND">Solo encontrados</option>
              </select>
              <select value={filters.categoryId} onChange={setFilter('categoryId')}>
                <option value="">Todas las categorías</option>
                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
              </select>
            </div>
          </form>

          {!feed && !error && <p>Cargando…</p>}
          {feed?.content.length === 0 && <p>No hay reportes que coincidan en tu sede.</p>}
          {feed?.content.map((r) => <ReportCard key={r.reportId} report={r} />)}
          {feed?.totalPages > 1 && (
            <div className="row between">
              <button className="link" disabled={page === 0} onClick={() => setPage(page - 1)}>← Anterior</button>
              <small>Página {page + 1} de {feed.totalPages}</small>
              <button className="link" disabled={page + 1 >= feed.totalPages} onClick={() => setPage(page + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}

      {view === 'mine' && (
        <>
          <select value={mineStatus} onChange={(e) => setMineStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          {!mine && !error && <p>Cargando…</p>}
          {mine?.length === 0 && <p>Aún no tienes reportes.</p>}
          {mine?.map((r) => (
            <ReportCard key={r.reportId} report={r} mine actions={r.status !== 'CLOSED' && (
              <div className="row">
                <button className="link" onClick={act(() => renewReport(r.reportId), 'Reporte renovado por 30 días más.')}>Renovar</button>
                {r.status === 'ACTIVE' && (
                  <button className="link" onClick={act(() => closeReport(r.reportId), 'Reporte cerrado.')}>Ya lo recuperé / cerrar</button>
                )}
              </div>
            )} />
          ))}
        </>
      )}

      {view === 'new' && (
        <ReportForm categories={categories} onCreated={(message) => { setInfo(message); setView('mine') }} />
      )}
    </>
  )
}
