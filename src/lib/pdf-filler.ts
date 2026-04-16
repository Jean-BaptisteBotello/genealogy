import { PDFDocument, StandardFonts } from 'pdf-lib'
import type { DemandeurProfile } from './demandeur-profile'

export type PaymentMode = 'carte' | 'virement' | 'cheque_banque' | 'cheque' | 'numeraire'

export interface Fill3233Data {
  demandeur?: DemandeurProfile
  nom: string
  prenoms: string
  dateNaissance: string | null
  lieuNaissance: string | null
  dateDeces: string | null
  lieuDeces: string | null
  typeRecherche: 'personne' | 'immeuble'
  commune?: string
  section?: string
  parcelle?: string
  spfName?: string
  paymentMode?: PaymentMode
}

export interface Fill3236Data {
  demandeur?: DemandeurProfile
  volume: string
  numero: string
  nature?: string
  dateFormalite?: string
  sagesOrSpf?: string
  spfName?: string
}

async function loadPDF(path: string): Promise<PDFDocument> {
  const response = await fetch(path)
  const bytes = await response.arrayBuffer()
  return PDFDocument.load(bytes)
}


function formatDateLieu(date: string | null, lieu: string | null): string {
  const parts: string[] = []
  if (date) {
    const d = new Date(date)
    if (!isNaN(d.getTime())) {
      parts.push(d.toLocaleDateString('fr-FR'))
    } else {
      parts.push(date)
    }
  }
  if (lieu) {
    parts.push(parts.length > 0 ? `à ${lieu}` : lieu)
  }
  return parts.join(' ')
}

export async function fill3233PDF(data: Fill3233Data): Promise<Uint8Array> {
  const pdf = await loadPDF('/forms/cerfa-3233-sd.pdf')
  const form = pdf.getForm()
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  const set = (fieldName: string, value: string) => {
    if (!value) return
    try {
      const field = form.getTextField(fieldName)
      field.setText(value)
      field.updateAppearances(font)
    } catch { /* field missing or not a text field */ }
  }

  // Demandeur (a1-a7)
  if (data.demandeur) {
    const d = data.demandeur
    set('a1', d.identite.toUpperCase())
    set('a2', d.adresseLigne1)
    set('a3', d.adresseLigne2)
    set('a4', d.adresseLigne3)
    set('a5', d.courriel)
    set('a6', d.telephone)
  }

  // SPF destinataire
  set('a11', data.spfName ?? '')

  // Ville de signature + date du jour
  if (data.demandeur?.adresseLigne3) {
    const city = data.demandeur.adresseLigne3.replace(/^\d{5}\s*/, '')
    set('a7', city)
  }
  const now = new Date()
  set('a8', String(now.getDate()).padStart(2, '0'))
  set('a9', String(now.getMonth() + 1).padStart(2, '0'))
  set('a10', String(now.getFullYear()))

  // Personne 1
  set('a12', data.nom.toUpperCase())
  set('a13', data.prenoms)
  set('a14', formatDateLieu(data.dateNaissance, data.lieuNaissance))

  // Immeubles (si recherche par immeuble)
  if (data.typeRecherche === 'immeuble') {
    set('a21', (data.commune ?? '').toUpperCase())
    const refs = [data.section, data.parcelle].filter(Boolean).join(' n°')
    set('a22', refs)
  }

  // Coût (b1/b2/zc1 pour recherche par personne simple)
  const nbPersonnes = 1
  const nbImmeubles = data.typeRecherche === 'immeuble' ? 1 : 0
  const isMixte = nbPersonnes > 0 && nbImmeubles > 0
  if (!isMixte) {
    set('b1', '1')
    set('b2', '12')
  } else {
    set('b3', '12')
  }
  const expeditionCourriel = !!data.demandeur?.courriel
  const total = isMixte ? 12 : 12
  const expedition = expeditionCourriel ? 0 : 2
  set('zc1', String(total + expedition))

  // Mode de paiement (cac2-cac6)
  if (data.paymentMode) {
    const checkboxMap: Record<PaymentMode, string> = {
      carte: 'cac2',
      virement: 'cac3',
      cheque_banque: 'cac4',
      cheque: 'cac5',
      numeraire: 'cac6',
    }
    const fieldName = checkboxMap[data.paymentMode]
    try {
      form.getCheckBox(fieldName).check()
    } catch { /* checkbox missing */ }
  }

  return pdf.save({ updateFieldAppearances: false })
}

export async function fill3236PDF(data: Fill3236Data): Promise<Uint8Array> {
  const pdf = await loadPDF('/forms/cerfa-3236-sd.pdf')
  const form = pdf.getForm()
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  const set = (fieldName: string, value: string) => {
    if (!value) return
    try {
      const field = form.getTextField(fieldName)
      field.setText(value)
      field.updateAppearances(font)
    } catch { /* field missing or not a text field */ }
  }

  // Demandeur (a1-a7)
  if (data.demandeur) {
    const d = data.demandeur
    set('a1', d.identite.toUpperCase())
    set('a2', d.adresseLigne1)
    set('a3', d.adresseLigne2)
    set('a4', d.adresseLigne3)
    set('a5', d.courriel)
    set('a6', d.telephone)
    if (d.adresseLigne3) {
      set('a7', d.adresseLigne3.replace(/^\d{5}\s*/, ''))
    }
  }

  // SPF destinataire
  set('a11', data.spfName ?? '')

  // Date du jour
  const now = new Date()
  set('a8', String(now.getDate()).padStart(2, '0'))
  set('a9', String(now.getMonth() + 1).padStart(2, '0'))
  set('a10', String(now.getFullYear()))

  // Formalité 1 : nature(a12), date(a13), SAGES(a14), volume(a15), numéro(a16)
  set('a12', data.nature ?? '')
  set('a13', data.dateFormalite ?? '')
  set('a14', data.sagesOrSpf ?? '')
  set('a15', data.volume)
  set('a16', data.numero)

  // 3236 has a `notice` button that crashes with updateFieldAppearances: true
  return pdf.save({ updateFieldAppearances: false })
}

/** Trigger browser download of a PDF */
export function downloadPDF(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
