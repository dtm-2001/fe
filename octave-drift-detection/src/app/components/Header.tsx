"use client"
import Link from "next/link"
import Image from "next/image"
import { Home } from "lucide-react"

export default function Header() {
  return (
    <header className="
        bg-gradient-to-r from-gray-950 to-gray-900 
        dark:from-gray-50 dark:to-gray-100
        py-6 shadow-xl border-b border-gray-700/50 
        dark:border-gray-300/50 backdrop-blur-sm transition-colors
      ">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <div className="relative h-10 w-32 mr-4">
            <Image
              src="https://www.octave.lk/wp-content/uploads/2023/11/logo.png"
              alt="OCTAVE Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600">
            Drift Detection Tool
          </h1>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            href="/"
            className="
              px-4 py-2 bg-sky-800/40 hover:bg-sky-700/60 text-white
              dark:text-gray-900 dark:bg-sky-200/40 dark:hover:bg-sky-200
              rounded-md text-sm font-medium transition-colors duration-200
              flex items-center gap-2
            "
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
