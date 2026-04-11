// Step #2 — formulaire qui se remplit (barres horizontales)
const bars: { width: string; color: string }[] = [
  { width: '92%', color: '#7c3aed' },
  { width: '78%', color: '#7c3aed' },
  { width: '66%', color: '#ede9fe' },
  { width: '84%', color: '#7c3aed' },
  { width: '50%', color: '#ede9fe' },
]

export function FormFillBars() {
  return (
    <div
      style={{
        height: 160,
        borderRadius: 8,
        background: '#faf8f4',
        border: '1px solid #ece9e2',
        position: 'relative',
        overflow: 'hidden',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            background: '#ece9e2',
            height: 7,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: bar.width,
              background: bar.color,
              borderRadius: 3,
            }}
          />
        </div>
      ))}

      {/* Italic serif arrow indicator */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: -10,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 22,
          color: '#7c3aed',
          background: '#faf8f4',
          padding: '0 6px',
        }}
      >
        ↳
      </div>
    </div>
  )
}
