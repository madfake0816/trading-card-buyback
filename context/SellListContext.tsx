'use client'

import { create } from 'zustand'

export interface SellListItem {
  id: string
  cardName: string
  setName: string
  setCode: string
  marketPrice: number
  buyPrice: number
  quantity: number
  imageUrl?: string
  tcg: string
}

interface SellListStore {
  items: SellListItem[]
  addItem: (item: SellListItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearList: () => void
  getTotalBuyPrice: () => number
}

export const useSellListStore = create<SellListStore>((set, get) => ({
  items: [],
  
  addItem: (item) => {
    const existingItem = get().items.find(
      (i) => i.cardName === item.cardName && i.setCode === item.setCode
    )
    
    if (existingItem) {
      set({
        items: get().items.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
      })
    } else {
      set({ items: [...get().items, { ...item, id: `${Date.now()}-${Math.random()}` }] })
    }
  },
  
  removeItem: (id) => {
    set({ items: get().items.filter((item) => item.id !== id) })
  },
  
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
    } else {
      set({
        items: get().items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        ),
      })
    }
  },
  
  clearList: () => {
    set({ items: [] })
  },
  
  getTotalBuyPrice: () => {
    return get().items.reduce((total, item) => total + item.buyPrice * item.quantity, 0)
  },
}))

export function SellListProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}