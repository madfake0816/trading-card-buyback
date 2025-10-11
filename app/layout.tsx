import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import FeatureToggle from '@/components/FeatureToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Salty Cards Buyback',
  description: 'Verkaufen Sie Ihre Sammelkarten',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {children}
        
        {/* Feature Toggle - Only visible with Ctrl+Shift+F */}
        {process.env.NODE_ENV === 'development' && <FeatureToggle />}
      </body>
    </html>
  )
}