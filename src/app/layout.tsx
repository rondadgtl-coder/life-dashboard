import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'Life Dashboard',
  manifest: '/manifest.json',
  description: 'לוח חיים לזוג עסוק',
  themeColor: '#6366f1',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Life Dashboard' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
