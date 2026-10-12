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
