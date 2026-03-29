// src/components/views/ViewRouter.tsx
import { CosmosView } from '@/components/cosmos/CosmosView'
import { SablierFlowView } from '@/components/views/sablier/SablierFlowView'
import { TimelineView } from '@/components/views/timeline/TimelineView'
import { CarteView } from '@/components/views/carte/CarteView'
import { EventailView } from '@/components/views/eventail/EventailView'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface ViewRouterProps {
  activeView: View
}

export function ViewRouter({ activeView }: ViewRouterProps) {
  switch (activeView) {
    case 'cosmos': return <CosmosView />
    case 'sablier': return <SablierFlowView />
    case 'timeline': return <TimelineView />
    case 'carte': return <CarteView />
    case 'eventail': return <EventailView />
  }
}
