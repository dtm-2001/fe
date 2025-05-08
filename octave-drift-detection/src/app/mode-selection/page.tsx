"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, AlertCircle } from "lucide-react"
import { getUseCasesForUser } from "@/services/modeSelectionService"

// Define a proper interface for the use case data
interface UseCase {
  name: string
  mode: string
  type: string
  businessUnit: string
}

// Helper function to get type color
const getTypeColor = (type: string) => {
  if (type.includes("RGCD")) return "from-sky-950/40 to-sky-900/20 border-sky-800/30"
  if (type.includes("CLCD")) return "from-emerald-950/40 to-emerald-900/20 border-emerald-800/30"
  if (type.includes("Other RG")) return "from-amber-950/40 to-amber-900/20 border-amber-800/30"
  return "from-rose-950/40 to-rose-900/20 border-rose-800/30" // Other CL
}

// Helper function to get type badge color
const getTypeBadgeColor = (type: string) => {
  if (type.includes("RGCD")) return "bg-sky-800/50 text-sky-200"
  if (type.includes("CLCD")) return "bg-emerald-800/50 text-emerald-200"
  if (type.includes("Other RG")) return "bg-amber-800/50 text-amber-200"
  return "bg-rose-800/50 text-rose-200" // Other CL
}

// Helper function to get mode number
const getModeNumber = (mode: string) => {
  return mode.replace("mode", "")
}

export default function ModeSelection() {
  const [currentUser, setCurrentUser] = useState("")
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUseCases() {
      try {
        setLoading(true)
        const user = localStorage.getItem("currentUser")
        if (!user) {
          router.push("/login")
          return
        }
        setCurrentUser(user)

        // Explicitly type the return value from getUseCasesForUser
        const userUseCases = (await getUseCasesForUser(user)) as UseCase[]

        if (userUseCases.length === 0) {
          setError("No use cases found for the current user.")
          return
        }
        setUseCases(userUseCases)
      } catch (err) {
        setError("Failed to load user data. Please try logging in again.")
        console.error("Error loading user data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadUseCases()
  }, [router])

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-12 w-12 text-sky-500 mb-4"
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
          <div className="text-sky-300 text-xl">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-8">
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-6 max-w-md backdrop-blur-sm shadow-lg">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-rose-400 mr-2" />
            <h3 className="text-xl font-medium text-rose-300">Authentication Error</h3>
          </div>
          <p className="text-rose-200 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-rose-800/50 hover:bg-rose-700/70 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  // Group use cases by business unit
  const groupedUseCases: Record<string, UseCase[]> = useCases.reduce(
    (groups, useCase) => {
      const businessUnit = useCase.businessUnit || "Other"
      if (!groups[businessUnit]) {
        groups[businessUnit] = []
      }
      groups[businessUnit].push(useCase)
      return groups
    },
    {} as Record<string, UseCase[]>,
  )

  return (
    <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-gray-900/80 rounded-xl shadow-xl overflow-hidden p-6 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600 mb-2">
            Welcome, {currentUser}
          </h1>
          <p className="text-sky-300 mb-4">Please select a use case to continue</p>

          {Object.entries(groupedUseCases).map(([businessUnit, cases]) => (
            <div key={businessUnit} className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">{businessUnit}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((useCase, index) => (
                  <Link
                    key={index}
                    href={`/${useCase.mode}?businessUnit=${encodeURIComponent(useCase.businessUnit || "")}&useCase=${encodeURIComponent(useCase.name || "")}`}
                    className={`bg-gradient-to-br ${getTypeColor(useCase.type)} p-6 rounded-lg border shadow-md transition-all duration-300 hover:shadow-sky-900/20 hover:border-sky-700/50 flex flex-col h-full`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeBadgeColor(useCase.type)}`}>
                        {useCase.type}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-gray-800/60 flex items-center justify-center">
                        <span className="text-lg font-bold text-sky-400">M{getModeNumber(useCase.mode)}</span>
                      </div>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">{useCase.name}</h2>
                    <div className="mt-auto pt-4 flex items-center text-sky-300 text-sm font-medium">
                      <span>Open Dashboard</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
