// Pain #2 — carte SPF avec pins
export function SpfMap() {
  return (
    <div
      style={{
        height: 160,
        borderRadius: 8,
        background: '#faf8f4',
        border: '1px solid #ece9e2',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage:
          'linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      {/* 4 grey pins */}
      <div style={{ position: 'absolute', top: '18%', left: '22%', width: 8, height: 8, background: '#c9c4b8', borderRadius: '50%', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
      <div style={{ position: 'absolute', top: '28%', left: '38%', width: 8, height: 8, background: '#c9c4b8', borderRadius: '50%', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
      <div style={{ position: 'absolute', top: '22%', left: '58%', width: 8, height: 8, background: '#c9c4b8', borderRadius: '50%', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
      <div style={{ position: 'absolute', top: '42%', left: '14%', width: 8, height: 8, background: '#c9c4b8', borderRadius: '50%', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
      <div style={{ position: 'absolute', top: '48%', left: '70%', width: 8, height: 8, background: '#c9c4b8', borderRadius: '50%', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />

      {/* Violet target pin */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '46%',
          width: 14,
          height: 14,
          background: '#7c3aed',
          borderRadius: '50%',
          border: '1.5px solid #fff',
          boxShadow: '0 0 0 6px rgba(124,58,237,.18), 0 2px 6px rgba(0,0,0,.2)',
        }}
      />

      {/* Tooltip label */}
      <div
        style={{
          position: 'absolute',
          top: '14%',
          left: '38%',
          fontSize: 10,
          background: '#1a1815',
          color: '#f4f1ea',
          padding: '3px 7px',
          borderRadius: 4,
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        SPF Marseille 2
        {/* Arrow caret — rendered via a rotated box */}
        <span
          style={{
            position: 'absolute',
            bottom: -3,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 6,
            height: 6,
            background: '#1a1815',
            display: 'block',
          }}
        />
      </div>

      {/* Filigrane "?" */}
      <div
        style={{
          position: 'absolute',
          fontStyle: 'italic',
          fontSize: 38,
          color: 'rgba(124,58,237,.18)',
          bottom: 6,
          right: 12,
          lineHeight: 1,
          fontFamily: 'Georgia, serif',
        }}
      >
        ?
      </div>
    </div>
  )
}
