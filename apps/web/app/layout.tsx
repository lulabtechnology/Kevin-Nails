import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KEVIN NAILS STUDIO',
  description: 'Turnos en tiempo real para uñas – Demo'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  )
}
