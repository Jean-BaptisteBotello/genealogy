const LS_KEY = 'genealogy_demandeur_profile'

export interface DemandeurProfile {
  identite: string
  adresseLigne1: string
  adresseLigne2: string
  adresseLigne3: string
  courriel: string
  telephone: string
}

export const EMPTY_PROFILE: DemandeurProfile = {
  identite: '',
  adresseLigne1: '',
  adresseLigne2: '',
  adresseLigne3: '',
  courriel: '',
  telephone: '',
}

export function loadDemandeurProfile(): DemandeurProfile {
  if (typeof window === 'undefined') return EMPTY_PROFILE
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return EMPTY_PROFILE
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) }
  } catch {
    return EMPTY_PROFILE
  }
}

export function saveDemandeurProfile(profile: DemandeurProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(profile))
}

export function isProfileComplete(p: DemandeurProfile): boolean {
  return !!(p.identite && p.adresseLigne1 && p.adresseLigne3)
}
