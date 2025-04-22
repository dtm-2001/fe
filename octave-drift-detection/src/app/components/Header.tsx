import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-blue-900 py-6 shadow-md border-b border-blue-700">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Image
            src="https://www.octave.lk/wp-content/uploads/2023/11/logo.png"
            alt="OCTAVE Logo"
            width={120}
            height={40}
            className="h-10 mr-4"
          />
          <h1 className="text-3xl font-bold text-blue-100">
            Drift Detection Tool
          </h1>
        </div>
        <nav>
          <Link href="/" className="text-blue-100 hover:text-white flex items-center gap-2">
            <i className="fas fa-home text-lg"></i>
            <span>Home</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}