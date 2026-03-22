'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Person } from '@/lib/types/database'

// Fix Leaflet default icon paths in Next.js (no webpack asset loader)
import L from 'leaflet'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface GeoPoint {
  person: Person
  lat: number
  lon: number
  type: 'birth' | 'death'
}

interface CarteViewInnerProps {
  geoPersons: GeoPoint[]
  onSelect: (id: string) => void
  selectedPersonId: string | null
}

export default function CarteViewInner({ geoPersons, onSelect }: CarteViewInnerProps) {
  const center: [number, number] = geoPersons.length > 0
    ? [geoPersons[0].lat, geoPersons[0].lon]
    : [46.6, 2.2]

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {geoPersons.map((gp, i) => (
        <Marker key={`${gp.person.id}-${gp.type}-${i}`} position={[gp.lat, gp.lon]}>
          <Popup>
            <button
              type="button"
              onClick={() => onSelect(gp.person.id)}
              style={{ cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <strong>{gp.person.prenom} {gp.person.nom}</strong>
              <br />
              {gp.type === 'birth' ? '🟢 Naissance' : '⚫ Décès'}
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
