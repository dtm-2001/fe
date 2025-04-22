'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const users: Record<string, ModeKey[]> = {
  'Senum': ['JMSL-Churn', 'CCS-Distribution Efficiency'],
  'Susara': ['JMSL-Churn', 'CCS-MT Promo', 'CCS-Distribution Efficiency'],
  'Shada': ['JMSL-Dry Sales']
}

type ModeKey = 'JMSL-Churn' | 'JMSL-Dry Sales' | 'CCS-MT Promo' | 'CCS-Distribution Efficiency'
interface ModeInfo {
  path: string
  name: string
}

const modeMapping: Record<ModeKey, ModeInfo> = {
  'JMSL-Churn': { path: 'mode1', name: 'OCTAVE RGCD' },
  'JMSL-Dry Sales': { path: 'mode2', name: 'Other RG' },
  'CCS-MT Promo': { path: 'mode3', name: 'OCTAVE CLCD' },
  'CCS-Distribution Efficiency': { path: 'mode4', name: 'Other CL' }
} as const

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (users[username as keyof typeof users]) {
      localStorage.setItem('currentUser', username)
      const userModes = users[username as keyof typeof users]
      localStorage.setItem('availableModes', JSON.stringify(
        userModes.map((mode: ModeKey) => modeMapping[mode])
      ))
      router.push('/mode-selection')
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-semibold text-blue-300 mb-6 text-center">Login</h2>
        {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-blue-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-blue-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}