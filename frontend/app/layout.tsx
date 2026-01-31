import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import TelegramWebAppInit from '@/components/TelegramWebAppInit'

export const metadata: Metadata = {
  title: 'Minutka - Ovqat yetkazib berish',
  description: 'Telegram orqali ovqat yetkazib berish platformasi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <head>
        {/* Telegram Web App Script */}
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body>
        <TelegramWebAppInit />
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

