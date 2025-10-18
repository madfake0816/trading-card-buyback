'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SellListItem {
  id: string
  cardName: string
  setCode: string
  setName: string
  collectorNumber?: string
  condition: string
  language: string
  foil: boolean
  quantity: number
  marketPrice: number
  buyPrice: number
  imageUrl: string
  tcg: string
}

interface SellListStore {
  items: SellListItem[]
  addItem: (item: SellListItem) => void
  removeItem: (setCode: string, cardName: string, collectorNumber: string) => void
  updateQuantity: (setCode: string, cardName: string, collectorNumber: string, quantity: number) => void
  clearList: () => void
}

export const useSellListStore = create<SellListStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.setCode === item.setCode &&
              i.cardName === item.cardName &&
              i.collectorNumber === item.collectorNumber
          )

          if (existingIndex >= 0) {
            const newItems = [...state.items]
            newItems[existingIndex].quantity += item.quantity
            return { items: newItems }
          }

          return { items: [...state.items, item] }
        }),
      removeItem: (setCode, cardName, collectorNumber) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.setCode === setCode &&
                item.cardName === cardName &&
                item.collectorNumber === collectorNumber
              )
          ),
        })),
      updateQuantity: (setCode, cardName, collectorNumber, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.setCode === setCode &&
            item.cardName === cardName &&
            item.collectorNumber === collectorNumber
              ? { ...item, quantity }
              : item
          ),
        })),
      clearList: () => set({ items: [] }),
    }),
    {
      name: 'sell-list-storage', // localStorage key
    }
  )
)