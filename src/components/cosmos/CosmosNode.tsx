interface CosmosNodeProps {
  id: string
  x: number
  y: number
  prenom: string
  nom: string
  isSelected: boolean
  isCenter: boolean
  branchColor: string
  onClick: (id: string) => void
  onHover: (id: string | null) => void
}

export function CosmosNode({
  id,
  x,
  y,
  prenom,
  nom,
  isSelected,
  isCenter,
  branchColor,
  onClick,
  onHover,
}: CosmosNodeProps) {
  const radius = isCenter ? 30 : 22
  const strokeWidth = isSelected ? 3 : 1.5
  const stroke = isSelected ? '#ffffff' : branchColor
  const initials =
    (prenom.charAt(0).toUpperCase()) + (nom.charAt(0).toUpperCase())

  return (
    <g
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={branchColor}
        fillOpacity={0.85}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={isCenter ? 14 : 12}
        onClick={() => onClick(id)}
      >
        {initials}
      </text>
    </g>
  )
}
