import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastContainer } from '@/components/ui/Toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MoniPool — Bitcoin yield. Naira simplicity. Community power.',
  description: 'Save with your community. Earn Bitcoin yield. Withdraw in naira.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#F9FAFB] font-sans antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
