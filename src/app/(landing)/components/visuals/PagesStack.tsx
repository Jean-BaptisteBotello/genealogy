// Pain #1 — pile de pages CERFA
export function PagesStack() {
  return (
    <div
      style={{
        height: 160,
        borderRadius: 8,
        background: '#faf8f4',
        border: '1px solid #ece9e2',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Page 1 — back-left, rotated -6deg */}
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '86%',
          background: '#fff',
          border: '1px solid #d9d6cf',
          borderRadius: 3,
          boxShadow: '0 6px 14px -8px rgba(0,0,0,.15)',
          top: '26%',
          left: '8%',
          transform: 'rotate(-6deg)',
        }}
      >
        {/* line 1 */}
        <div style={{ position: 'absolute', left: '12%', right: '12%', top: '22%', height: 4, background: '#ece9e2', borderRadius: 2 }} />
        {/* lines 2-5 */}
        <div style={{ position: 'absolute', left: '12%', right: '12%', top: '38%', height: 4, background: '#ece9e2', borderRadius: 2, boxShadow: '0 14px 0 #ece9e2, 0 28px 0 #ece9e2, 0 42px 0 #ece9e2' }} />
      </div>

      {/* Page 2 — middle, rotated 2deg */}
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '86%',
          background: '#fff',
          border: '1px solid #d9d6cf',
          borderRadius: 3,
          boxShadow: '0 6px 14px -8px rgba(0,0,0,.15)',
          top: '14%',
          left: '18%',
          transform: 'rotate(2deg)',
        }}
      >
        <div style={{ position: 'absolute', left: '12%', right: '12%', top: '22%', height: 4, background: '#ece9e2', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: '12%', right: '12%', top: '38%', height: 4, background: '#ece9e2', borderRadius: 2, boxShadow: '0 14px 0 #ece9e2, 0 28px 0 #ece9e2, 0 42px 0 #ece9e2' }} />
      </div>

      {/* Page 3 — front, rotated 7deg, violet border */}
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '86%',
          background: '#fff',
          border: '1px solid #c9b9f7',
          borderRadius: 3,
          boxShadow: '0 6px 14px -8px rgba(0,0,0,.15)',
          top: '4%',
          left: '28%',
          transform: 'rotate(7deg)',
        }}
      >
        <div style={{ position: 'absolute', left: '12%', right: '12%', top: '22%', height: 4, background: '#ece9e2', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: '12%', right: '12%', top: '38%', height: 4, background: '#ece9e2', borderRadius: 2, boxShadow: '0 14px 0 #ece9e2, 0 28px 0 #ece9e2, 0 42px 0 #ece9e2' }} />
      </div>

      {/* CERFA stamp badge */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          right: '14%',
          width: 36,
          height: 36,
          border: '1.5px dashed #7c3aed',
          borderRadius: '50%',
          color: '#7c3aed',
          fontSize: 9,
          textAlign: 'center',
          lineHeight: 1,
          paddingTop: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          background: 'rgba(237,233,254,.6)',
          transform: 'rotate(-12deg)',
        }}
      >
        CERFA<br />3233
      </div>
    </div>
  )
}
