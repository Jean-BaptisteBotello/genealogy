// Pain #3 — calendrier d'attente
const Day = ({ passed, now }: { passed?: boolean; now?: boolean }) => (
  <div
    style={{
      aspectRatio: '1',
      background: now ? '#7c3aed' : passed ? '#d9d4c9' : '#ece9e2',
      borderRadius: 2,
      boxShadow: now ? '0 0 0 2px #ede9fe' : undefined,
    }}
  />
)

export function CalendarWait() {
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
      {/* Row 1 — 5 passed, 2 empty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        <Day passed /><Day passed /><Day passed /><Day passed /><Day passed /><Day /><Day />
      </div>
      {/* Row 2 — all empty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        <Day /><Day /><Day /><Day /><Day /><Day /><Day />
      </div>
      {/* Row 3 — all empty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        <Day /><Day /><Day /><Day /><Day /><Day /><Day />
      </div>
      {/* Row 4 — last cell is "now" (violet) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        <Day /><Day /><Day /><Day /><Day /><Day /><Day now />
      </div>

      {/* Gradient arrow with label */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 14,
          right: 14,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,.6), transparent)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#faf8f4',
            padding: '0 8px',
            fontSize: 10,
            color: '#7c3aed',
            fontWeight: 600,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          délai variable
        </span>
      </div>
    </div>
  )
}
