'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const userAccess = {
  'Senum': [
    { name: 'JMSL-Churn', mode: 'mode1', type: 'OCTAVE RGCD' },
    { name: 'CCS-Distribution Efficiency', mode: 'mode4', type: 'Other CL' }
  ],
  'Susara': [
    { name: 'JMSL-Churn', mode: 'mode1', type: 'OCTAVE RGCD' },
    { name: 'CCS-MT Promo', mode: 'mode3', type: 'OCTAVE CLCD' },
    { name: 'CCS-Distribution Efficiency', mode: 'mode4', type: 'Other CL' }
  ],
  'Shada': [
    { name: 'JMSL-Dry Sales', mode: 'mode2', type: 'Other RG' }
  ]
}

export default function ModeSelection() {
  const [currentUser, setCurrentUser] = useState('')
  const [useCases, setUseCases] = useState<Array<{name: string, mode: string, type: string}>>([])
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (!user || !userAccess[user as keyof typeof userAccess]) {
      router.push('/login')
      return
    }
    setCurrentUser(user)
    setUseCases(userAccess[user as keyof typeof userAccess])
  }, [router])

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <h1 className="text-2xl font-bold text-blue-300 mb-8">Welcome, {currentUser}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {useCases.map((uc, index) => (
          <Link 
            key={index}
            href={`/${uc.mode}`}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold text-blue-300">{uc.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}