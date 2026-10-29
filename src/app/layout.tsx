import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
})

// Pokud je nastavená proměnná prostředí nebo ostrá doména, použije ji, jinak padá na Vercel
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hadaci.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    siteName: 'Hádači.cz',
    locale: 'cs_CZ',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hádači.cz – Denní vědomostní dedukce',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hádači.cz – Denní vědomostní dedukce',
    description:
      'Uhádni dnešní českou osobnost, památku či fenomén na co nejméně stop. Zvládneš to bez nápovědy?',
    images: ['/og-image.png'],
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