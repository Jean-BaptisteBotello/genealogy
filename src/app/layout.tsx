import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/context/theme-context'

export const metadata: Metadata = {
  title: 'Généalogie',
  description: 'Arbre généalogique collaboratif',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased" style={{ background: 'var(--body-bg, #050a14)', color: 'var(--text-primary, white)' }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
