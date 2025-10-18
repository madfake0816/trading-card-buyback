'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SellListItem {
  id: string
  cardName: string
  setCode: string
  setName: string
  collectorNumber?: string
  condition?: string
  language?: string
  foil?: boolean
  quantity: number
  marketPrice: number
  buyPrice: number
  imageUrl: string
  tcg: string
}

// Type for adding items - makes optional fields truly optional
type AddItemInput = Omit<SellListItem, 'condition' | 'language' | 'foil' | 'collectorNumber'> & {
  condition?: string
  language?: string
  foil?: boolean
  collectorNumber?: string
}

interface SellListStore {
  items: SellListItem[]
  addItem: (item: AddItemInput) => void
  removeItem: (setCode: string, cardName: string, collectorNumber?: string) => void
  updateQuantity: (setCode: string, cardName: string, collectorNumber: string | undefined, quantity: number) => void
  clearList: () => void
  getTotalCards: () => number
  getTotalBuyPrice: () => number
  getTotalMarketValue: () => number
}

export const useSellListStore = create<SellListStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          // Apply defaults for optional fields
          const fullItem: SellListItem = {
            condition: 'NM',
            language: 'en',
            foil: false,
            collectorNumber: undefined,
            ...item,
          }

          const existingIndex = state.items.findIndex(
            (i) =>
              i.setCode === fullItem.setCode &&
              i.cardName === fullItem.cardName &&
              i.collectorNumber === fullItem.collectorNumber &&
              i.condition === fullItem.condition &&
              i.foil === fullItem.foil &&
              i.language === fullItem.language
          )

          if (existingIndex >= 0) {
            const newItems = [...state.items]
            newItems[existingIndex].quantity += fullItem.quantity
            return { items: newItems }
          }

          return { items: [...state.items, fullItem] }
        }),
      removeItem: (setCode, cardName, collectorNumber) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.setCode === setCode &&
                item.cardName === cardName &&
                (collectorNumber === undefined || item.collectorNumber === collectorNumber)
              )
          ),
        })),
      updateQuantity: (setCode, cardName, collectorNumber, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.setCode === setCode &&
            item.cardName === cardName &&
            (collectorNumber === undefined || item.collectorNumber === collectorNumber)
              ? { ...item, quantity }
              : item
          ),
        })),
      clearList: () => set({ items: [] }),
      getTotalCards: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.quantity, 0)
      },
      getTotalBuyPrice: () => {
        const state = get()
        return state.items.reduce((total, item) => total + (item.buyPrice * item.quantity), 0)
      },
      getTotalMarketValue: () => {
        const state = get()
        return state.items.reduce((total, item) => total + (item.marketPrice * item.quantity), 0)
      },
    }),
    {
      name: 'sell-list-storage', // localStorage key
    }
  )
)