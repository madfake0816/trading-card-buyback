'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSellListStore } from '@/context/SellListContext'
interface CheckoutProps {
  onClose: () => void
}

export default function Checkout({ onClose }: CheckoutProps) {
  const { language } = useLanguage()
  const { getTotalBuyPrice, items } = useSellListStore()
  const [selectedOption, setSelectedOption] = useState<'store' | 'mail' | null>(null)

  const shopAddress = {
    name: 'Card Shop Buyback',
    street: 'Musterstraße 123',
    city: '12345 Musterstadt',
    country: language === 'de' ? 'Deutschland' : 'Germany',
    email: 'buyback@cardshop.com',
    phone: '+49 123 456789',
  }

  const nonBindingNotice = language === 'de'
    ? 'Die angezeigten Preise sind ein unverbindliches Angebot. Das endgültige Angebot wird nach Erhalt und Prüfung der Karten in unserem Shop erstellt. Wir behalten uns vor, Preise basierend auf dem tatsächlichen Zustand der Karten anzupassen.'
    : 'The displayed prices are a non-binding offer. The final offer will be made after receiving and inspecting the cards at our shop. We reserve the right to adjust prices based on the actual condition of the cards.'

  const storeText = language === 'de' ? {
    title: 'Besuch im Laden',
    description: 'Bringen Sie Ihre Karten persönlich in unseren Laden. Wir prüfen die Karten vor Ort und zahlen sofort bar aus.',
    advantages: [
      'Sofortige Auszahlung in bar',
      'Direktes Feedback zur Kartenqualität',
      'Keine Versandkosten',
      'Persönliche Beratung',
    ],
    addressTitle: 'Unsere Adresse',
    hoursTitle: 'Öffnungszeiten',
    hours: [
      'Montag - Freitag: 10:00 - 19:00 Uhr',
      'Samstag: 10:00 - 16:00 Uhr',
      'Sonntag: Geschlossen',
    ],
  } : {
    title: 'Visit Our Store',
    description: 'Bring your cards to our store in person. We will check the cards on-site and pay you immediately in cash.',
    advantages: [
      'Immediate cash payment',
      'Direct feedback on card condition',
      'No shipping costs',
      'Personal consultation',
    ],
    addressTitle: 'Our Address',
    hoursTitle: 'Opening Hours',
    hours: [
      'Monday - Friday: 10:00 AM - 7:00 PM',
      'Saturday: 10:00 AM - 4:00 PM',
      'Sunday: Closed',
    ],
  }

  const mailText = language === 'de' ? {
    title: 'Versand per Post',
    description: 'Senden Sie Ihre Karten sicher verpackt an unsere Adresse. Nach Prüfung überweisen wir den Betrag auf Ihr Konto.',
    advantages: [
      'Bequem von zu Hause',
      'Versand auf eigene Kosten und Risiko',
      'Zahlung per Banküberweisung',
      'Detaillierte Aufstellung per E-Mail',
    ],
    instructions: [
      'Karten gut schützen (Sleeves, Toploader)',
      'Verkaufsliste als CSV ausdrucken und beilegen',
      'Name, Adresse und Bankverbindung angeben',
      'Versicherten Versand nutzen',
      'E-Mail mit Sendungsverfolgung an uns senden',
    ],
    instructionsTitle: 'Versandanleitung',
    warning: 'Wichtig: Der Versand erfolgt auf eigenes Risiko. Wir empfehlen versicherten Versand.',
  } : {
    title: 'Mail-In Service',
    description: 'Send your cards securely packaged to our address. After inspection, we will transfer the amount to your account.',
    advantages: [
      'Convenient from home',
      'Shipping at your own cost and risk',
      'Payment via bank transfer',
      'Detailed statement via email',
    ],
    instructions: [
      'Protect cards well (sleeves, toploaders)',
      'Print and include sell list as CSV',
      'Include name, address, and bank details',
      'Use insured shipping',
      'Send email with tracking number to us',
    ],
    instructionsTitle: 'Shipping Instructions',
    warning: 'Important: Shipping is at your own risk. We recommend insured shipping.',
  }

  const totalAmount = getTotalBuyPrice()

 return (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4">
    <div className="bg-dark-blue-light border border-yellow-accent rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-yellow-accent">
            {language === 'de' ? 'Checkout' : 'Checkout'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Non-Binding Offer Notice */}
        <div className="bg-blue-900 bg-opacity-40 border border-blue-400 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
          <div className="flex items-start">
            <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">ℹ️</span>
            <div>
              <h3 className="font-bold mb-1 text-blue-300 text-sm sm:text-base">
                {language === 'de' ? 'Unverbindliches Angebot' : 'Non-Binding Offer'}
              </h3>
              <p className="text-xs sm:text-sm text-blue-200">
                {nonBindingNotice}
              </p>
            </div>
          </div>
        </div>

        {/* Quality Notice */}
        <div className="bg-yellow-accent text-black p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <div className="flex items-start">
            <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">⚠️</span>
            <div>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-dark-blue p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 text-center">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">
            {language === 'de' ? 'Geschätzter Gesamtbetrag' : 'Estimated Total Amount'}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-yellow-accent">
            €{totalAmount.toFixed(2)}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 mt-2">
            {language === 'de' 
              ? `${items.length} Karten in Ihrer Verkaufsliste`
              : `${items.length} cards in your sell list`
            }
          </div>
          <div className="text-xs text-blue-300 mt-2">
            {language === 'de' ? '(Unverbindliches Angebot)' : '(Non-binding offer)'}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {language === 'de' ? 'Wählen Sie eine Option' : 'Choose an Option'}
          </h3>

          {/* Store Visit Option */}
          <button
            onClick={() => setSelectedOption('store')}
            className={`w-full text-left p-4 sm:p-6 rounded-lg border-2 transition-all ${
              selectedOption === 'store'
                ? 'border-yellow-accent bg-dark-blue'
                : 'border-gray-600 hover:border-yellow-accent'
            }`}
          >
            <div className="flex items-start">
              <span className="text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0">🏪</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg sm:text-xl font-bold text-yellow-accent mb-2">
                  {storeText.title}
                </h4>
                <p className="text-sm sm:text-base text-gray-300 mb-3">{storeText.description}</p>
                <ul className="space-y-1">
                  {storeText.advantages.map((adv, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-gray-400 flex items-start">
                      <span className="text-yellow-accent mr-2 flex-shrink-0">✓</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>

          {/* Mail-In Option */}
          <button
            onClick={() => setSelectedOption('mail')}
            className={`w-full text-left p-4 sm:p-6 rounded-lg border-2 transition-all ${
              selectedOption === 'mail'
                ? 'border-yellow-accent bg-dark-blue'
                : 'border-gray-600 hover:border-yellow-accent'
            }`}
          >
            <div className="flex items-start">
              <span className="text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0">📦</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg sm:text-xl font-bold text-yellow-accent mb-2">
                  {mailText.title}
                </h4>
                <p className="text-sm sm:text-base text-gray-300 mb-3">{mailText.description}</p>
                <ul className="space-y-1">
                  {mailText.advantages.map((adv, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-gray-400 flex items-start">
                      <span className="text-yellow-accent mr-2 flex-shrink-0">✓</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        </div>

        {/* Detailed Information - Only show when option selected */}
        {selectedOption === 'store' && (
          <div className="bg-dark-blue p-4 sm:p-6 rounded-lg space-y-4 text-sm sm:text-base">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-yellow-accent mb-3">
                {storeText.addressTitle}
              </h4>
              <div className="text-gray-300 space-y-1">
                <p className="font-semibold">{shopAddress.name}</p>
                <p>{shopAddress.street}</p>
                <p>{shopAddress.city}</p>
                <p>{shopAddress.country}</p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-gray-300 break-all">
                  <span className="text-yellow-accent">📧</span> {shopAddress.email}
                </p>
                <p className="text-gray-300">
                  <span className="text-yellow-accent">📞</span> {shopAddress.phone}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-bold text-yellow-accent mb-3">
                {storeText.hoursTitle}
              </h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                {storeText.hours.map((hour, idx) => (
                  <li key={idx}>{hour}</li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs sm:text-sm text-gray-400">
                {language === 'de'
                  ? 'Bitte bringen Sie Ihre Verkaufsliste (CSV-Export) oder zeigen Sie sie auf Ihrem Smartphone vor.'
                  : 'Please bring your sell list (CSV export) or show it on your smartphone.'
                }
              </p>
            </div>
          </div>
        )}

        {selectedOption === 'mail' && (
          <div className="bg-dark-blue p-4 sm:p-6 rounded-lg space-y-4 text-sm sm:text-base">
            <div className="bg-red-900 bg-opacity-30 border border-red-500 p-3 sm:p-4 rounded">
              <p className="text-red-300 text-xs sm:text-sm font-semibold">{mailText.warning}</p>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-bold text-yellow-accent mb-3">
                {mailText.instructionsTitle}
              </h4>
              <ol className="space-y-2">
                {mailText.instructions.map((instruction, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start text-xs sm:text-sm">
                    <span className="text-yellow-accent font-bold mr-2 sm:mr-3 flex-shrink-0">{idx + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            

            <div>
              <h4 className="text-base sm:text-lg font-bold text-yellow-accent mb-3">
                {storeText.addressTitle}
              </h4>
              <div className="text-gray-300 space-y-1 bg-dark-blue-light p-3 sm:p-4 rounded text-xs sm:text-sm">
                <p className="font-semibold">{shopAddress.name}</p>
                <p>{language === 'de' ? 'Ankauf-Abteilung' : 'Buyback Department'}</p>
                <p>{shopAddress.street}</p>
                <p>{shopAddress.city}</p>
                <p>{shopAddress.country}</p>
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-bold text-yellow-accent mb-3">
                {language === 'de' ? 'Kontakt' : 'Contact'}
              </h4>
              <div className="space-y-2">
                <p className="text-gray-300 break-all text-xs sm:text-sm">
                  <span className="text-yellow-accent">📧</span> {shopAddress.email}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  {language === 'de'
                    ? 'Senden Sie uns nach dem Versand eine E-Mail mit der Sendungsverfolgungsnummer.'
                    : 'Send us an email with the tracking number after shipping.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-4 sm:mt-6">
          <button onClick={onClose} className="btn-secondary w-full sm:w-auto order-2 sm:order-1">
            {language === 'de' ? 'Zurück' : 'Back'}
          </button>
          {selectedOption && (
            <button
              onClick={() => {
                alert(
                  language === 'de'
                    ? 'Vielen Dank! Vergessen Sie nicht, Ihre Verkaufsliste zu exportieren.'
                    : 'Thank you! Don\'t forget to export your sell list.'
                )
                onClose()
              }}
              className="btn-primary w-full sm:w-auto order-1 sm:order-2"
            >
              {language === 'de' ? 'Bestätigen' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)
}