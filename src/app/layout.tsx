import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Généalogie',
  description: 'Arbre généalogique collaboratif',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#050a14] text-white antialiased">{children}</body>
    </html>
  )
}
