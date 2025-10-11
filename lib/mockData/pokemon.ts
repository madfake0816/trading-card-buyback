export interface MockCard {
  id: string
  name: string
  nameDE: string
  sets: {
    code: string
    name: string
    nameDE: string
    marketPrice: number
  }[]
  imageUrl: string
}

export const pokemonMockData: MockCard[] = [
  {
    id: 'pikachu-1',
    name: 'Pikachu VMAX',
    nameDE: 'Pikachu VMAX',
    sets: [
      { code: 'VIV', name: 'Vivid Voltage', nameDE: 'Lebendige Spannung', marketPrice: 45.99 },
      { code: 'SWSH', name: 'Sword & Shield Promo', nameDE: 'Schwert & Schild Promo', marketPrice: 38.50 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh4/188_hires.png',
  },
  {
    id: 'charizard-1',
    name: 'Charizard VSTAR',
    nameDE: 'Glurak VSTAR',
    sets: [
      { code: 'BRS', name: 'Brilliant Stars', nameDE: 'Strahlende Sterne', marketPrice: 89.99 },
      { code: 'PGO', name: 'Pokemon GO', nameDE: 'Pokemon GO', marketPrice: 75.00 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh9/18_hires.png',
  },
  {
    id: 'mewtwo-1',
    name: 'Mewtwo V',
    nameDE: 'Mewtu V',
    sets: [
      { code: 'FST', name: 'Fusion Strike', nameDE: 'Fusionsangriff', marketPrice: 12.50 },
      { code: 'PR-SW', name: 'Promo', nameDE: 'Promo', marketPrice: 15.00 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh8/30_hires.png',
  },
  {
    id: 'lugia-1',
    name: 'Lugia V',
    nameDE: 'Lugia V',
    sets: [
      { code: 'SIT', name: 'Silver Tempest', nameDE: 'Silberner Sturm', marketPrice: 8.99 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh12/138_hires.png',
  },
  {
    id: 'rayquaza-1',
    name: 'Rayquaza VMAX',
    nameDE: 'Rayquaza VMAX',
    sets: [
      { code: 'EVS', name: 'Evolving Skies', nameDE: 'Evolvierende Himmel', marketPrice: 95.00 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh7/111_hires.png',
  },
  {
    id: 'umbreon-1',
    name: 'Umbreon VMAX',
    nameDE: 'Nachtara VMAX',
    sets: [
      { code: 'EVS', name: 'Evolving Skies', nameDE: 'Evolvierende Himmel', marketPrice: 120.00 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh7/95_hires.png',
  },
  {
    id: 'eevee-1',
    name: 'Eevee',
    nameDE: 'Evoli',
    sets: [
      { code: 'CRE', name: 'Chilling Reign', nameDE: 'Herrschaft der Kälte', marketPrice: 2.50 },
      { code: 'VIV', name: 'Vivid Voltage', nameDE: 'Lebendige Spannung', marketPrice: 1.99 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh6/119_hires.png',
  },
  {
    id: 'mew-1',
    name: 'Mew VMAX',
    nameDE: 'Mew VMAX',
    sets: [
      { code: 'FST', name: 'Fusion Strike', nameDE: 'Fusionsangriff', marketPrice: 42.00 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh8/114_hires.png',
  },
  {
    id: 'gengar-1',
    name: 'Gengar VMAX',
    nameDE: 'Gengar VMAX',
    sets: [
      { code: 'FST', name: 'Fusion Strike', nameDE: 'Fusionsangriff', marketPrice: 18.50 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh8/157_hires.png',
  },
  {
    id: 'giratina-1',
    name: 'Giratina VSTAR',
    nameDE: 'Giratina VSTAR',
    sets: [
      { code: 'LOR', name: 'Lost Origin', nameDE: 'Verlorener Ursprung', marketPrice: 32.00 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh11/131_hires.png',
  },
  {
    id: 'dialga-1',
    name: 'Dialga VSTAR',
    nameDE: 'Dialga VSTAR',
    sets: [
      { code: 'BRS', name: 'Brilliant Stars', nameDE: 'Strahlende Sterne', marketPrice: 28.00 },
    ],
    imageUrl: 'https://images.pokemontcg.io/swsh9/139_hires.png',
  },
]