'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslations } from '@/lib/i18n'
import { useSellListStore } from '@/context/SellListContext'
import { calculateBuyPrice } from '@/lib/pricing'

interface CSVImporterProps {
  tcgName: string
  cards: any[]
}

interface CSVPreview {
  headers: string[]
  sampleRows: any[]
  detectedMappings: {
    cardName?: string
    quantity?: string
    setCode?: string
  }
}

export default function CSVImporter({ tcgName, cards }: CSVImporterProps) {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const addItem = useSellListStore((state) => state.addItem)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [csvPreview, setCSVPreview] = useState<CSVPreview | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [columnMappings, setColumnMappings] = useState<{
    cardName: string
    quantity: string
    setCode: string
  }>({
    cardName: '',
    quantity: '',
    setCode: '',
  })

  const detectColumnMapping = (headers: string[]): typeof columnMappings => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
    
    // Card name detection patterns
    const cardNamePatterns = [
      'card name', 'name', 'cardname', 'card', 'product name', 'title',
      'kartenname', 'karte', 'produkt', 'produktname'
    ]
    
    // Quantity detection patterns
    const quantityPatterns = [
      'quantity', 'qty', 'count', 'amount', 'number', '#',
      'anzahl', 'menge', 'stück', 'stuck'
    ]
    
    // Set code detection patterns
    const setPatterns = [
      'set code', 'set', 'edition', 'expansion', 'setcode', 'set name',
      'edition code', 'exp', 'series',
      'ausgabe', 'edition'
    ]
    
    const findMatch = (patterns: string[]) => {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i]
        if (patterns.some(pattern => header.includes(pattern))) {
          return headers[i]
        }
      }
      return ''
    }
    
    return {
      cardName: findMatch(cardNamePatterns),
      quantity: findMatch(quantityPatterns),
      setCode: findMatch(setPatterns),
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.data.length === 0) {
          alert(language === 'de' 
            ? 'Die CSV-Datei ist leer oder konnte nicht gelesen werden.'
            : 'The CSV file is empty or could not be read.'
          )
          return
        }

        const headers = Object.keys(results.data[0] as object)
        const sampleRows = results.data.slice(0, 5)
        const detectedMappings = detectColumnMapping(headers)

        setRawData(results.data)
        setCSVPreview({
          headers,
          sampleRows,
          detectedMappings,
        })
        setColumnMappings(detectedMappings)
        setShowPreview(true)
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        alert(language === 'de'
          ? 'Fehler beim Lesen der CSV-Datei.'
          : 'Error reading CSV file.'
        )
      }
    })
  }

 const processCSV = () => {
  if (!columnMappings.cardName) {
    alert(language === 'de'
      ? 'Bitte wählen Sie eine Spalte für den Kartennamen aus.'
      : 'Please select a column for card name.'
    )
    return
  }

  let importedCount = 0
  let skippedCount = 0

  rawData.forEach((row) => {
    const cardName = row[columnMappings.cardName]?.toString().trim()
    const quantity = columnMappings.quantity 
      ? parseInt(row[columnMappings.quantity]) || 1
      : 1
    const setCode = columnMappings.setCode
      ? row[columnMappings.setCode]?.toString().trim()
      : ''

    if (!cardName) {
      skippedCount++
      return
    }

    // Try to find matching card in our data (fuzzy match)
    const matchedCard = cards.find(
      (card) =>
        card.name.toLowerCase().includes(cardName.toLowerCase()) ||
        cardName.toLowerCase().includes(card.name.toLowerCase()) ||
        card.nameDE?.toLowerCase().includes(cardName.toLowerCase()) ||
        cardName.toLowerCase().includes(card.nameDE?.toLowerCase())
    )

    if (matchedCard) {
      // Try to match set
      let matchedSet = matchedCard.sets[0]
      if (setCode) {
        const foundSet = matchedCard.sets.find(
          (s: any) => 
            s.code.toLowerCase() === setCode.toLowerCase() ||
            s.name.toLowerCase().includes(setCode.toLowerCase())
        )
        if (foundSet) matchedSet = foundSet
      }

      // Ensure marketPrice exists and is valid
      const marketPrice = matchedSet?.marketPrice ?? 0.50
      
      // Debug logging
      console.log('CSV Import Debug:', {
        cardName: matchedCard.name,
        marketPrice: marketPrice,
        marketPriceType: typeof marketPrice
      })

      // Calculate buy price using the new pricing logic
      const buyPrice = calculateBuyPrice(marketPrice)
      
      console.log('Calculated buyPrice:', buyPrice)

      addItem({
        id: `${matchedCard.id}-${matchedSet.code}-${Date.now()}-${Math.random()}`,
        cardName: language === 'de' ? (matchedCard.nameDE || matchedCard.name) : matchedCard.name,
        setName: language === 'de' ? (matchedSet.nameDE || matchedSet.name) : matchedSet.name,
        setCode: matchedSet.code,
        marketPrice: marketPrice,
        buyPrice: buyPrice,
        quantity: quantity,
        imageUrl: matchedCard.imageUrl || '',
        tcg: tcgName,
      })

      importedCount++
    } else {
      console.log('Card not found:', cardName)
      skippedCount++
    }
  })

  const message = language === 'de'
    ? `Erfolgreich ${importedCount} Karten importiert. ${skippedCount} übersprungen.`
    : `Successfully imported ${importedCount} cards. ${skippedCount} skipped.`
  
  alert(message)
  
  setShowPreview(false)
  setCSVPreview(null)
  setRawData([])
  
  if (fileInputRef.current) {
    fileInputRef.current.value = ''
  }
}

  const cancelImport = () => {
    setShowPreview(false)
    setCSVPreview(null)
    setRawData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload" className="btn-secondary cursor-pointer inline-block">
        {t('importCSV')}
      </label>

      {showPreview && csvPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-blue-light border border-yellow-accent rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-yellow-accent mb-4">
                {language === 'de' ? 'CSV-Import Vorschau' : 'CSV Import Preview'}
              </h2>

              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  {language === 'de'
                    ? 'Bitte überprüfen Sie die erkannten Spalten und passen Sie sie bei Bedarf an:'
                    : 'Please review the detected columns and adjust if necessary:'
                  }
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-yellow-accent">
                      {language === 'de' ? 'Kartennamen-Spalte *' : 'Card Name Column *'}
                    </label>
                    <select
                      value={columnMappings.cardName}
                      onChange={(e) => setColumnMappings({ ...columnMappings, cardName: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">
                        {language === 'de' ? '-- Bitte auswählen --' : '-- Please select --'}
                      </option>
                      {csvPreview.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-yellow-accent">
                      {language === 'de' ? 'Anzahl-Spalte (optional)' : 'Quantity Column (optional)'}
                    </label>
                    <select
                      value={columnMappings.quantity}
                      onChange={(e) => setColumnMappings({ ...columnMappings, quantity: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">
                        {language === 'de' ? '-- Keine / Standard 1 --' : '-- None / Default 1 --'}
                      </option>
                      {csvPreview.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-yellow-accent">
                      {language === 'de' ? 'Set-Code-Spalte (optional)' : 'Set Code Column (optional)'}
                    </label>
                    <select
                      value={columnMappings.setCode}
                      onChange={(e) => setColumnMappings({ ...columnMappings, setCode: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">
                        {language === 'de' ? '-- Keine / Erstes Set --' : '-- None / First Set --'}
                      </option>
                      {csvPreview.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-yellow-accent mb-2">
                  {language === 'de' ? 'Beispieldaten' : 'Sample Data'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        {csvPreview.headers.map((header) => (
                          <th key={header} className="text-left p-2 text-yellow-accent">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.sampleRows.map((row: any, idx) => (
                        <tr key={idx} className="border-b border-gray-700">
                          {csvPreview.headers.map((header) => (
                            <td key={header} className="p-2 text-gray-300">
                              {row[header]?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button onClick={cancelImport} className="btn-secondary">
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button onClick={processCSV} className="btn-primary">
                  {language === 'de' ? 'Importieren' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}