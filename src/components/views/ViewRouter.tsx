// src/components/views/ViewRouter.tsx
// Stub — will be replaced in C4-2
type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'
interface ViewRouterProps { activeView: View }
export function ViewRouter({ activeView }: ViewRouterProps) {
  return <div style={{ color: 'white', padding: 20 }}>View: {activeView}</div>
}
