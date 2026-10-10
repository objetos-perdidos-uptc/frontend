export default function Placeholder({ title, owner }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>Pantalla pendiente — la implementa la {owner}.</p>
    </div>
  )
}
