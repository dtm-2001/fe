import React from 'react'
import Header from './components/Header'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-900 text-gray-100">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}