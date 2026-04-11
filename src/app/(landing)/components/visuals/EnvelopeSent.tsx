// Step #3 — enveloppe envoyée avec check violet et mini-pin SPF
export function EnvelopeSent() {
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Swoosh line on the left */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 16,
          transform: 'translateY(-50%)',
          width: 42,
          height: 1,
          background: 'linear-gradient(90deg, transparent, #7c3aed)',
          opacity: 0.5,
        }}
      />

      {/* Envelope body */}
      <div
        style={{
          width: 120,
          height: 80,
          background: '#fff',
          border: '1.5px solid #1a1815',
          borderRadius: 6,
          position: 'relative',
          transform: 'rotate(-3deg)',
          boxShadow: '0 10px 24px -12px rgba(0,0,0,.2)',
        }}
      >
        {/* Triangle flap (top of envelope) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: '#f4f1ea',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            borderBottom: '1.5px solid #1a1815',
          }}
        />

        {/* Violet check badge */}
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: -12,
            width: 26,
            height: 26,
            background: '#7c3aed',
            color: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 4px 10px rgba(124,58,237,.4)',
          }}
        >
          ✓
        </div>
      </div>

      {/* Mini pin label */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          background: '#1a1815',
          color: '#f4f1ea',
          fontSize: 9,
          padding: '4px 8px',
          borderRadius: 4,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        📍 SPF Marseille 2
      </div>
    </div>
  )
}
