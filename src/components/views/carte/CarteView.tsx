'use client'
import dynamic from 'next/dynamic'
import { useTree } from '@/lib/context/tree-context'
import { EmptyTreeState } from '@/components/shared/EmptyTreeState'
import type { Person } from '@/lib/types/database'

const CarteViewInner = dynamic(() => import('./CarteViewInner'), { ssr: false })

interface GeoPoint {
  person: Person
  lat: number
  lon: number
  type: 'birth' | 'death'
}

export function CarteView() {
  const { persons, selectedPersonId, selectPerson, openAddPerson } = useTree()

  if (persons.length === 0) {
    return <EmptyTreeState onAddPerson={openAddPerson} />
  }

  const geoPoints: GeoPoint[] = []
  const nonGeoPersonIds = new Set<string>()

  for (const p of persons) {
    const hasBirth = p.lat_naissance !== null && p.lon_naissance !== null
    const hasDeath = p.lat_deces !== null && p.lon_deces !== null
    if (hasBirth) {
      geoPoints.push({ person: p, lat: p.lat_naissance!, lon: p.lon_naissance!, type: 'birth' })
    }
    if (hasDeath) {
      geoPoints.push({ person: p, lat: p.lat_deces!, lon: p.lon_deces!, type: 'death' })
    }
    if (!hasBirth && !hasDeath) {
      nonGeoPersonIds.add(p.id)
    }
  }

  const nonGeoCount = nonGeoPersonIds.size

  return (
    <div className="w-full h-full relative">
      <CarteViewInner
        geoPersons={geoPoints}
        onSelect={selectPerson}
        selectedPersonId={selectedPersonId}
      />
      {nonGeoCount > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] text-xs text-gray-500 bg-[#0d1117] border border-[#1e3a5f] rounded px-2 py-1">
          {nonGeoCount} lieu{nonGeoCount > 1 ? 'x' : ''} non géolocalisé{nonGeoCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
