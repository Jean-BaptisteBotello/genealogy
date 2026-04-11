// Step #1 — mini arbre généalogique SVG
export function MiniTree() {
  return (
    <div
      style={{
        height: 160,
        borderRadius: 8,
        background: '#faf8f4',
        border: '1px solid #ece9e2',
        position: 'relative',
        overflow: 'hidden',
        padding: 14,
      }}
    >
      <svg
        viewBox="0 0 240 130"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Links */}
        <path d="M 60 30 L 120 70" stroke="#c9c4b8" strokeWidth="1.2" fill="none" />
        <path d="M 180 30 L 120 70" stroke="#c9c4b8" strokeWidth="1.2" fill="none" />
        {/* Highlighted link to "Vous" */}
        <path d="M 120 70 L 60 110" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
        <path d="M 120 70 L 180 110" stroke="#c9c4b8" strokeWidth="1.2" fill="none" />

        {/* Node: Marie */}
        <circle cx="60" cy="30" r="11" fill="#fff" stroke="#d9d4c9" strokeWidth="1.2" />
        <text x="60" y="50" fontFamily="Inter, sans-serif" fontSize="8" fill="#4a4641" textAnchor="middle">Marie</text>

        {/* Node: Henri */}
        <circle cx="180" cy="30" r="11" fill="#fff" stroke="#d9d4c9" strokeWidth="1.2" />
        <text x="180" y="50" fontFamily="Inter, sans-serif" fontSize="8" fill="#4a4641" textAnchor="middle">Henri</text>

        {/* Node: Antoine */}
        <circle cx="120" cy="70" r="12" fill="#fff" stroke="#d9d4c9" strokeWidth="1.2" />
        <text x="120" y="90" fontFamily="Inter, sans-serif" fontSize="8" fill="#4a4641" textAnchor="middle">Antoine</text>

        {/* Node: Vous (highlighted) */}
        <circle cx="60" cy="110" r="12" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" />
        <text x="60" y="129" fontFamily="Inter, sans-serif" fontSize="8" fill="#7c3aed" fontWeight="600" textAnchor="middle">Vous</text>

        {/* Node: Sœur */}
        <circle cx="180" cy="110" r="11" fill="#fff" stroke="#d9d4c9" strokeWidth="1.2" />
        <text x="180" y="129" fontFamily="Inter, sans-serif" fontSize="8" fill="#4a4641" textAnchor="middle">Sœur</text>
      </svg>
    </div>
  )
}
