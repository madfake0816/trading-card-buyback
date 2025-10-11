'use client'

import { useState } from 'react'
import { useSellListStore } from '@/context/SellListContext'
import { useLanguage } from '@/context/LanguageContext'

interface ShippingInfo {
  senderName: string
  senderStreet: string
  senderPostal: string
  senderCity: string
  senderEmail: string
  senderPhone: string
}

export default function DHLShippingLabel() {
  const [isOpen, setIsOpen] = useState(false)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    senderName: '',
    senderStreet: '',
    senderPostal: '',
    senderCity: '',
    senderEmail: '',
    senderPhone: '',
  })
  
  const { language } = useLanguage()
  const items = useSellListStore((state) => state.items)
  const getTotalBuyPrice = useSellListStore((state) => state.getTotalBuyPrice)

  // Your shop address (recipient)
  const SHOP_ADDRESS = {
    name: 'Salty Cards',
    street: 'Musterstraße 123',
    postal: '12345',
    city: 'Berlin',
    country: 'Deutschland'
  }

  const handlePrint = () => {
    // Save form data to localStorage for next time
    localStorage.setItem('dhl_shipping_info', JSON.stringify(shippingInfo))
    
    // Open print dialog
    window.print()
  }

  const handleOpen = () => {
    // Load saved shipping info if available
    const savedInfo = localStorage.getItem('dhl_shipping_info')
    if (savedInfo) {
      try {
        setShippingInfo(JSON.parse(savedInfo))
      } catch (e) {
        console.error('Failed to load saved shipping info')
      }
    }
    setIsOpen(true)
  }

  const isFormValid = 
    shippingInfo.senderName.trim() !== '' &&
    shippingInfo.senderStreet.trim() !== '' &&
    shippingInfo.senderPostal.trim() !== '' &&
    shippingInfo.senderCity.trim() !== ''

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        disabled={items.length === 0}
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        📦 {language === 'de' ? 'DHL Versandmarke drucken' : 'Print DHL Shipping Label'}
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Print Styles - Only visible when printing */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #dhl-label, #dhl-label * {
                visibility: visible;
              }
              #dhl-label {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* Modal Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print"
            onClick={() => setIsOpen(false)}
          >
            <div 
              className="bg-dark-blue-light rounded-lg border-2 border-yellow-accent max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-yellow-accent">
                    📦 {language === 'de' ? 'DHL Versandmarke' : 'DHL Shipping Label'}
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white text-3xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
                  <p className="font-semibold mb-2 text-blue-300">
                    ℹ️ {language === 'de' ? 'Hinweis:' : 'Note:'}
                  </p>
                  <p className="text-sm text-gray-300">
                    {language === 'de' 
                      ? 'Bitte füllen Sie Ihre Absenderadresse aus. Diese Informationen werden für zukünftige Sendungen gespeichert.'
                      : 'Please fill in your sender address. This information will be saved for future shipments.'}
                  </p>
                </div>

                {/* Sender Address Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      {language === 'de' ? 'Name' : 'Name'} *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.senderName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, senderName: e.target.value })}
                      className="input-field w-full"
                      placeholder={language === 'de' ? 'Max Mustermann' : 'John Doe'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      {language === 'de' ? 'Straße & Hausnummer' : 'Street & Number'} *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.senderStreet}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, senderStreet: e.target.value })}
                      className="input-field w-full"
                      placeholder={language === 'de' ? 'Musterstraße 42' : 'Main Street 42'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      {language === 'de' ? 'Postleitzahl' : 'Postal Code'} *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.senderPostal}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, senderPostal: e.target.value })}
                      className="input-field w-full"
                      placeholder="12345"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      {language === 'de' ? 'Stadt' : 'City'} *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.senderCity}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, senderCity: e.target.value })}
                      className="input-field w-full"
                      placeholder={language === 'de' ? 'Berlin' : 'Berlin'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      {language === 'de' ? 'E-Mail' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={shippingInfo.senderEmail}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, senderEmail: e.target.value })}
                      className="input-field w-full"
                      placeholder="max@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      {language === 'de' ? 'Telefon' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={shippingInfo.senderPhone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, senderPhone: e.target.value })}
                      className="input-field w-full"
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>

                {/* Preview Label */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-accent">
                    {language === 'de' ? 'Vorschau:' : 'Preview:'}
                  </h3>
                  <div className="border-2 border-gray-700 rounded-lg p-4 bg-white text-black">
                    <LabelPreview 
                      sender={shippingInfo}
                      recipient={SHOP_ADDRESS}
                      itemCount={items.length}
                      totalValue={getTotalBuyPrice()}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-700 bg-gray-800 bg-opacity-50">
                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    disabled={!isFormValid}
                    className="flex-1 px-6 py-3 bg-yellow-accent hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🖨️ {language === 'de' ? 'Drucken' : 'Print'}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {language === 'de' ? '✕ Schließen' : '✕ Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Printable Label */}
          <div id="dhl-label" className="hidden">
            <PrintableLabel
              sender={shippingInfo}
              recipient={SHOP_ADDRESS}
              itemCount={items.length}
              totalValue={getTotalBuyPrice()}
              language={language}
            />
          </div>
        </>
      )}
    </>
  )
}

// Preview Component
function LabelPreview({ sender, recipient, itemCount, totalValue }: any) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-gray-600 mb-1">Von / From:</div>
          <div className="font-semibold">{sender.senderName || '_______________'}</div>
          <div>{sender.senderStreet || '_______________'}</div>
          <div>{sender.senderPostal || '_____'} {sender.senderCity || '_______________'}</div>
        </div>
        <div className="text-4xl font-bold text-yellow-600">DHL</div>
      </div>

      <div className="border-t-2 border-gray-300 pt-4">
        <div className="text-xs text-gray-600 mb-1">An / To:</div>
        <div className="text-xl font-bold">{recipient.name}</div>
        <div className="text-lg">{recipient.street}</div>
        <div className="text-2xl font-bold">{recipient.postal} {recipient.city}</div>
        <div className="text-lg">{recipient.country}</div>
      </div>

      <div className="border-t border-gray-300 pt-2 text-xs text-gray-600">
        <div>Inhalt: {itemCount} Trading Cards</div>
        <div>Wert: €{totalValue.toFixed(2)}</div>
      </div>
    </div>
  )
}

// Printable Label Component
function PrintableLabel({ sender, recipient, itemCount, totalValue, language }: any) {
  return (
    <div style={{ 
      width: '210mm', 
      minHeight: '148mm', 
      padding: '10mm',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12pt',
      backgroundColor: 'white',
      color: 'black'
    }}>
      {/* DHL Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20mm',
        borderBottom: '3px solid #FFCC00',
        paddingBottom: '5mm'
      }}>
        <div style={{ fontSize: '48pt', fontWeight: 'bold', color: '#FFCC00' }}>
          DHL
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10pt', color: '#666' }}>
            {new Date().toLocaleDateString('de-DE')}
          </div>
        </div>
      </div>

      {/* Sender Address (Small) */}
      <div style={{ 
        fontSize: '8pt', 
        marginBottom: '3mm',
        color: '#666'
      }}>
        <div>{sender.senderName}</div>
        <div>{sender.senderStreet}, {sender.senderPostal} {sender.senderCity}</div>
      </div>

      {/* Recipient Address (Large) */}
      <div style={{ 
        border: '2px solid black',
        padding: '10mm',
        marginBottom: '10mm',
        minHeight: '40mm'
      }}>
        <div style={{ fontSize: '10pt', color: '#666', marginBottom: '3mm' }}>
          {language === 'de' ? 'Empfänger / Recipient' : 'Recipient'}
        </div>
        <div style={{ fontSize: '20pt', fontWeight: 'bold', marginBottom: '2mm' }}>
          {recipient.name}
        </div>
        <div style={{ fontSize: '16pt', marginBottom: '2mm' }}>
          {recipient.street}
        </div>
        <div style={{ fontSize: '24pt', fontWeight: 'bold', marginBottom: '2mm' }}>
          {recipient.postal} {recipient.city}
        </div>
        <div style={{ fontSize: '16pt' }}>
          {recipient.country}
        </div>
      </div>

      {/* Package Details */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10pt',
        borderTop: '1px solid #ccc',
        paddingTop: '5mm'
      }}>
        <div>
          <div style={{ color: '#666' }}>
            {language === 'de' ? 'Inhalt:' : 'Contents:'}
          </div>
          <div style={{ fontWeight: 'bold' }}>
            {itemCount} Trading Cards
          </div>
        </div>
        <div>
          <div style={{ color: '#666' }}>
            {language === 'de' ? 'Wert:' : 'Value:'}
          </div>
          <div style={{ fontWeight: 'bold' }}>
            €{totalValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Barcode Placeholder */}
      <div style={{ 
        marginTop: '10mm',
        textAlign: 'center',
        padding: '10mm',
        border: '1px dashed #ccc'
      }}>
        <div style={{ 
          fontSize: '48pt', 
          letterSpacing: '10px',
          fontFamily: 'monospace'
        }}>
          ||||||||||||||||||||||||
        </div>
        <div style={{ fontSize: '8pt', color: '#666', marginTop: '3mm' }}>
          {language === 'de' 
            ? 'Barcode wird von DHL generiert' 
            : 'Barcode will be generated by DHL'}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '10mm',
        fontSize: '8pt',
        color: '#666',
        textAlign: 'center'
      }}>
        {language === 'de'
          ? 'Bitte bei DHL aufgeben oder Paketshop abgeben'
          : 'Please drop off at DHL or parcel shop'}
      </div>
    </div>
  )
}