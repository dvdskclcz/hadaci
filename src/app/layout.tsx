import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://hadaci.cz'),
  title: {
    default: 'Hádači.cz – Denní vědomostní dedukce',
    template: '%s | Hádači.cz',
  },
  description:
    'Uhádni dnešní českou osobnost, památku, vynález či popkulturní fenomén na co nejméně stop. Prověř své znalosti nebo otestuj AI asistenty!',
  applicationName: 'Hádači.cz',
  authors: [{ name: 'Hádači.cz' }],
  keywords: ['hádanky', 'kvíz', 'wordle česky', 'vědomostní hra', 'české osobnosti', 'dedukce'],
  openGraph: {
    title: 'Hádači.cz – Denní vědomostní dedukce',
    description:
      'Uhádni dnešní českou osobnost, památku či fenomén na co nejméně stop. Zvládneš to bez nápovědy?',
    url: 'https://hadaci.cz',
    siteName: 'Hádači.cz',
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hádači.cz – Denní vědomostní dedukce',
    description:
      'Uhádni dnešní českou osobnost, památku či fenomén na co nejméně stop. Zvládneš to bez nápovědy?',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}