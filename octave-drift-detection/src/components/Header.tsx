'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface NavigationItem {
  path: string
  label: string
  icon?: React.ReactNode
  isActive?: boolean
}

interface HeaderProps {
  title: string
  logoUrl: string
  navigationItems?: NavigationItem[]
  className?: string
  onNavigation?: (path: string) => void
}

export default function Header({
  title,
  logoUrl,
  navigationItems = [],
  className = '',
  onNavigation
}: HeaderProps) {
  return (
    <header className={`flex items-center p-4 bg-white shadow-sm ${className}`}>
      <div className="flex items-center">
        <Image
          src={logoUrl}
          alt={`${title} logo`}
          width={48}
          height={48}
          className="rounded-full"
          priority
        />
        <h1 className="ml-3 text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      <nav className="ml-auto">
        <ul className="flex space-x-4">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                onClick={() => onNavigation?.(item.path)}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  item.isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}