"use client"
import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { User, Lock, AlertCircle } from "lucide-react"

const users: Record<string, ModeKey[]> = {
  Senum: ["JMSL-Churn", "CCS-Distribution Efficiency"],
  Susara: ["JMSL-Churn", "CCS-MT Promo", "CCS-Distribution Efficiency"],
  Shada: ["JMSL-Dry Sales"],
}

type ModeKey = "JMSL-Churn" | "JMSL-Dry Sales" | "CCS-MT Promo" | "CCS-Distribution Efficiency"
interface ModeInfo {
  path: string
  name: string
}

const modeMapping: Record<ModeKey, ModeInfo> = {
  "JMSL-Churn": { path: "mode1", name: "OCTAVE RGCD" },
  "JMSL-Dry Sales": { path: "mode2", name: "Other RG" },
  "CCS-MT Promo": { path: "mode3", name: "OCTAVE CLCD" },
  "CCS-Distribution Efficiency": { path: "mode4", name: "Other CL" },
} as const

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate network delay
    setTimeout(() => {
      if (users[username as keyof typeof users]) {
        localStorage.setItem("currentUser", username)
        const userModes = users[username as keyof typeof users]
        localStorage.setItem("availableModes", JSON.stringify(userModes.map((mode: ModeKey) => modeMapping[mode])))
        router.push("/mode-selection")
      } else {
        setError("Invalid username or password")
        setIsLoading(false)
      }
    }, 800)
  }

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-8 w-full max-w-md border border-gray-700/50 backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-2 text-center">
          OCTAVE
        </h2>
        <p className="text-sky-300 text-center mb-8">Drift Detection Tool</p>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-rose-400 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-rose-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-sky-300 mb-2">Username</label>
            <div className="relative">
              <div className="absolute left-0 top-0 h-full pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                required
                placeholder="Enter your username"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-sky-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-0 top-0 h-full pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/80 border border-sky-700/50 rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                required
                placeholder="Enter your password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-800/60 hover:bg-sky-700/80 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
          <p className="text-gray-400 text-sm">
            Demo users: Senum, Susara, Shada
            <br />
            <span className="text-xs">(Any password will work)</span>
          </p>
        </div>
      </div>
    </div>
  )
}