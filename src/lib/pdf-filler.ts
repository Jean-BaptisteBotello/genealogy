import { PDFDocument } from 'pdf-lib'

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

/**
 * Try to fill an AcroForm text field by name, swallowing errors if the
 * field isn't a text field or doesn't exist.
 */
function trySetText(
  form: ReturnType<PDFDocument['getForm']>,
  fieldName: string,
  value: string
): boolean {
  try {
    const field = form.getTextField(fieldName)
    field.setText(value)
    return true
  } catch {
    return false
  }
}

/**
 * Generic field-name matcher. Iterates through form fields and maps them
 * to the provided data based on substring heuristics on the field name.
 */
function fillByHeuristics(
  pdf: PDFDocument,
  mappings: Array<{ match: (name: string) => boolean; value: string }>
): boolean {
  const form = pdf.getForm()
  const fields = form.getFields()
  if (fields.length === 0) return false

  for (const field of fields) {
    const name = field.getName()
    const lower = name.toLowerCase()
    for (const { match, value } of mappings) {
      if (match(lower)) {
        trySetText(form, name, value)
        break
      }
    }
  }
  return true
}

/**
 * Fallback: draw text directly onto the first page at approximate positions.
 * Used when the PDF has no AcroForm fields (flattened Cerfa).
 */
function drawFallback(
  pdf: PDFDocument,
  lines: Array<{ label: string; value: string }>
) {
  const page = pdf.getPage(0)
  const { height } = page.getSize()
  const fontSize = 10
  const startY = height - 280
  const lineHeight = 20
  lines.forEach((line, i) => {
    if (!line.value) return
    page.drawText(`${line.label}: ${line.value}`, {
      x: 200,
      y: startY - i * lineHeight,
      size: fontSize,
    })
  })
}

export async function fill3233PDF(data: Fill3233Data): Promise<Uint8Array> {
  const pdf = await loadPDF('/forms/cerfa-3233-sd.pdf')

  const hasFields = fillByHeuristics(pdf, [
    { match: (n) => n.includes('nom') && !n.includes('prenom') && !n.includes('prénom'), value: data.nom },
    { match: (n) => n.includes('prenom') || n.includes('prénom'), value: data.prenoms },
    { match: (n) => n.includes('naissance') && n.includes('date'), value: data.dateNaissance ?? '' },
    { match: (n) => n.includes('naissance') && n.includes('lieu'), value: data.lieuNaissance ?? '' },
    { match: (n) => (n.includes('deces') || n.includes('décès')) && n.includes('date'), value: data.dateDeces ?? '' },
    { match: (n) => (n.includes('deces') || n.includes('décès')) && n.includes('lieu'), value: data.lieuDeces ?? '' },
    { match: (n) => n.includes('commune'), value: data.commune ?? '' },
    { match: (n) => n.includes('section'), value: data.section ?? '' },
    { match: (n) => n.includes('parcelle'), value: data.parcelle ?? '' },
  ])

  if (!hasFields) {
    drawFallback(pdf, [
      { label: 'Nom', value: data.nom },
      { label: 'Prénoms', value: data.prenoms },
      { label: 'Date de naissance', value: data.dateNaissance ?? '' },
      { label: 'Lieu de naissance', value: data.lieuNaissance ?? '' },
      { label: 'Date de décès', value: data.dateDeces ?? '' },
      { label: 'Lieu de décès', value: data.lieuDeces ?? '' },
    ])
  }

  return pdf.save({ updateFieldAppearances: false })
}

export async function fill3236PDF(data: Fill3236Data): Promise<Uint8Array> {
  const pdf = await loadPDF('/forms/cerfa-3236-sd.pdf')

  const hasFields = fillByHeuristics(pdf, [
    { match: (n) => n.includes('nom') && !n.includes('prenom') && !n.includes('prénom'), value: data.nom },
    { match: (n) => n.includes('prenom') || n.includes('prénom'), value: data.prenoms },
    { match: (n) => n.includes('naissance') && n.includes('date'), value: data.dateNaissance ?? '' },
    { match: (n) => n.includes('naissance') && n.includes('lieu'), value: data.lieuNaissance ?? '' },
    { match: (n) => (n.includes('deces') || n.includes('décès')) && n.includes('date'), value: data.dateDeces ?? '' },
    { match: (n) => (n.includes('deces') || n.includes('décès')) && n.includes('lieu'), value: data.lieuDeces ?? '' },
    { match: (n) => n.includes('volume'), value: data.volume },
    { match: (n) => n.includes('numero') || n.includes('numéro') || n.includes('n°'), value: data.numero },
  ])

  if (!hasFields) {
    drawFallback(pdf, [
      { label: 'Nom', value: data.nom },
      { label: 'Prénoms', value: data.prenoms },
      { label: 'Date de naissance', value: data.dateNaissance ?? '' },
      { label: 'Lieu de naissance', value: data.lieuNaissance ?? '' },
      { label: 'Volume', value: data.volume },
      { label: 'Numéro', value: data.numero },
    ])
  }

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
