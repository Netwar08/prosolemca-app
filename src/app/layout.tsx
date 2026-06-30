// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Open_Sans, Bebas_Neue } from 'next/font/google'
import './globals.css'

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Empresas Prosolemca — Gestión Técnica',
  description: 'Sistema de gestión de actividades técnicas e instalaciones',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prosolemca',
  },
}

export const viewport: Viewport = {
  themeColor: '#103352',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${openSans.variable} ${bebasNeue.variable}`}>
      <body className={openSans.className}>
        {children}
      </body>
    </html>
  )
}
