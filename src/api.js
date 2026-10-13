// Cliente HTTP único del frontend. Todos los servicios pasan por el Gateway (/api).
const TOKEN_KEY = 'token'

export const auth = {
  get token() { return localStorage.getItem(TOKEN_KEY) },
  set token(v) { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY) },
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    auth.token = null
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.detail || data?.message || `Error ${res.status}`)
  return data
}

// --- Auth (auth-service, Persona 1). Ajustar la ruta/campos al contrato real. ---
export const login = (email, password) =>
  api('/auth/login', { method: 'POST', body: { email, password } })

// --- Reportes (report-service, Persona 2) ---
const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return s ? `?${s}` : ''
}

export const reportCategories = () => api('/reports/categories')
export const reportFeed = (params = {}) => api(`/reports/feed${qs(params)}`)
export const myReports = (status) => api(`/reports/me${qs({ status })}`)
export const getReport = (id) => api(`/reports/${id}`)
export const createReport = (payload) => api('/reports', { method: 'POST', body: payload })
export const updateReport = (id, payload) => api(`/reports/${id}`, { method: 'PUT', body: payload })
export const closeReport = (id, reason) =>
  api(`/reports/${id}/close`, { method: 'PATCH', body: { reason } })
export const renewReport = (id) => api(`/reports/${id}/renew`, { method: 'PATCH' })

// Las fotos van como multipart, por eso no usan api() (que siempre envía JSON).
export async function uploadReportPhotos(id, files) {
  const form = new FormData()
  for (const f of files) form.append('photos', f)
  const res = await fetch(`/api/reports/${id}/photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}` },
    body: form,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data
}

// El Gateway exige el token también para las imágenes, así que un <img src> directo no sirve:
// se descarga la foto con el token y se devuelve una URL local para mostrarla.
export async function reportPhotoUrl(photoPath) {
  const res = await fetch(`/api${photoPath}`, { headers: { Authorization: `Bearer ${auth.token}` } })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return URL.createObjectURL(await res.blob())
}

// --- Reclamos (claim-service) ---
export const createClaim = (payload) => api('/claims', { method: 'POST', body: payload })
export const verifyOtp = (id, code) =>
  api(`/claims/${id}/otp/verify`, { method: 'POST', body: { code } })
export const resendOtp = (id) => api(`/claims/${id}/otp/resend`, { method: 'POST' })
export const myClaims = () => api('/claims/me')
export const claimsByReport = (reportId) => api(`/claims/report/${reportId}`)
export const resolveClaim = (id, status) =>
  api(`/claims/${id}/resolve`, { method: 'PATCH', body: { status } })
export const claimMetrics = () => api('/claims/metrics')

// --- Matching (matching-service, Persona 3) ---
export const myRecommendations = (reportId, minScore = 0) =>
  api(`/matches/lost/${reportId}/recommendations${qs({ minScore })}`)

export const myFoundCandidates = (reportId, minScore = 0) =>
  api(`/matches/found/${reportId}/candidates${qs({ minScore })}`)

// --- Notificaciones (notification-service, Persona 3) ---
export const myNotifications = (unreadOnly = false) =>
  api(`/notifications/me${qs({ unread: unreadOnly })}`)

export const markNotificationRead = (id) =>
  api(`/notifications/${id}/read`, { method: 'PATCH' })

export const adminAlerts = () => api('/notifications/admin/alerts')
