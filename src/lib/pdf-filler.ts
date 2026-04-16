import { PDFDocument, StandardFonts } from 'pdf-lib'

export interface Fill3233Data {
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
}

export interface Fill3236Data {
  nom: string
  prenoms: string
  dateNaissance: string | null
  lieuNaissance: string | null
  dateDeces: string | null
  lieuDeces: string | null
  volume: string
  numero: string
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

  // SPF destinataire
  set('a11', data.spfName ?? '')

  // Date du jour (JJ / MM / AAAA)
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

  // Date du jour
  const now = new Date()
  set('a8', String(now.getDate()).padStart(2, '0'))
  set('a9', String(now.getMonth() + 1).padStart(2, '0'))
  set('a10', String(now.getFullYear()))

  // Formalité 1
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
