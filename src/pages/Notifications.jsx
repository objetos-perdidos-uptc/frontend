import { useEffect, useState } from 'react'
import { markNotificationRead, myNotifications } from '../api.js'

const TYPE_LABEL = {
  HIGH_MATCH: '🎯 Coincidencia alta',
  CLAIM: '📋 Reclamo',
  FRAUD_ALERT: '🚨 Alerta de fraude',
  EXPIRING_SOON: '⏳ Por expirar',
  EXPIRED_INFO: '⌛ Expirado',
}

export default function Notifications() {
  const [items, setItems] = useState(null)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [error, setError] = useState('')

  const load = (unread = unreadOnly) =>
    myNotifications(unread).then(setItems).catch((e) => setError(e.message))

  useEffect(() => { load() }, [unreadOnly])

  const toggleUnread = () => {
    const next = !unreadOnly
    setUnreadOnly(next)
    load(next)
  }

  const markRead = async (n) => {
    if (n.isRead) return
    try {
      await markNotificationRead(n.id)
      // actualiza sin recargar todo
      setItems((prev) =>
        unreadOnly ? prev.filter((x) => x.id !== n.id) : prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x)
      )
    } catch (e) { setError(e.message) }
  }

  const unreadCount = items?.filter((n) => !n.isRead).length ?? 0

  return (
    <>
      {error && <p className="error">{error}</p>}

      <div className="row between">
        <h2>Notificaciones {unreadCount > 0 && <span className="badge pending">{unreadCount}</span>}</h2>
        <button className="link" onClick={toggleUnread}>
          {unreadOnly ? 'Ver todas' : 'Ver solo no leídas'}
        </button>
      </div>

      {!items && !error && <p>Cargando…</p>}
      {items?.length === 0 && <p>No tienes notificaciones{unreadOnly ? ' sin leer' : ''}.</p>}

      {items?.map((n) => (
        <div
          key={n.id}
          className={`card ${n.isRead ? '' : 'unread'}`}
          onClick={() => markRead(n)}
          style={{ cursor: n.isRead ? 'default' : 'pointer', opacity: n.isRead ? 0.7 : 1 }}
        >
          <div className="row between">
            <b>{TYPE_LABEL[n.type] ?? n.type}</b>
            {!n.isRead && <span className="badge pending">Nueva</span>}
          </div>
          <p>{n.message}</p>
          <small>
            {new Date(n.dateTime).toLocaleString()}
            {n.refReportId && ` · Reporte #${n.refReportId}`}
          </small>
        </div>
      ))}
    </>
  )
}
