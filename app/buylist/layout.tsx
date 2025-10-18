import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MTG Buylist - Magic: The Gathering Card Prices | CardFlow',
  description: 'Search our Magic: The Gathering buylist for instant card prices. Fair prices, fast payment. Sell your MTG cards today!',
  keywords: 'MTG buylist, Magic The Gathering, sell MTG cards, card buylist, MTG prices',
  openGraph: {
    title: 'MTG Buylist | CardFlow',
    description: 'Search our buylist for instant MTG card prices',
    type: 'website',
  }
}

export default function BuylistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}