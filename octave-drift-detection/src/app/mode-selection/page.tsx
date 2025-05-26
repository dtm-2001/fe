"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  AlertCircle,
  User,
  Grid3x3,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { getUseCasesForUser } from "@/services/modeSelectionService"

interface UseCase {
  name: string
  mode: "mode1" | "mode2" | "mode3" | "mode4"
  type: string
  businessUnit: string
  alertKeeper: string
}

// Dark‐mode only config
const modeConfig: Record<UseCase["mode"], { bgColor: string; badgeColor: string }> = {
  mode1: {
    // Darker than 900, closer to blue-black
    bgColor: "bg-blue-950 border-blue-900",
    badgeColor: "bg-blue-900 text-blue-200",
  },
  mode2: {
    bgColor: "bg-amber-950 border-amber-900",
    badgeColor: "bg-amber-900 text-amber-200",
  },
  mode3: {
    bgColor: "bg-emerald-950 border-emerald-900",
    badgeColor: "bg-emerald-900 text-emerald-200",
  },
  mode4: {
    bgColor: "bg-emerald-950 border-red-900",
    badgeColor: "bg-red-900 text-red-200",
  },
}


// Fallback data when backend fails
const fallbackUseCases: UseCase[] = [
  {
    name: "Sales Overview",
    mode: "mode1",
    type: "Summary Dashboard",
    businessUnit: "Sales",
    alertKeeper: "noreply@company.com",
  },
  {
    name: "Marketing Trends",
    mode: "mode2",
    type: "Analytics",
    businessUnit: "Marketing",
    alertKeeper: "noreply@company.com",
  },
  {
    name: "Support Tickets",
    mode: "mode3",
    type: "Live Queue",
    businessUnit: "Customer Success",
    alertKeeper: "noreply@company.com",
  },
]

export default function ModeSelection() {
  const router = useRouter()
  const [user, setUser] = useState<string>("")
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const u = localStorage.getItem("currentUser")
      if (!u) {
        router.push("/login")
        return
      }
      setUser(u)

      if (!navigator.onLine) {
        console.warn("Offline – using fallback dashboards")
        setUseCases(fallbackUseCases)
        setLoading(false)
        return
      }

      try {
        const data = (await getUseCasesForUser(u)) as UseCase[]
        if (data.length > 0) {
          setUseCases(data)
        } else {
          console.warn("No dashboards returned – using fallback data")
          setUseCases(fallbackUseCases)
        }
      } catch (err) {
        console.warn("Error loading dashboards – using fallback data", err)
        setUseCases(fallbackUseCases)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-96">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
            <p className="text-gray-400 font-medium">
              Loading your dashboards...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-red-700 rounded-2xl p-8 shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 bg-red-900 rounded-full mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white text-center mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-400 text-center mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  const grouped = useCases.reduce<Record<string, UseCase[]>>((acc, uc) => {
    const bu = uc.businessUnit || "Other"
    ;(acc[bu] ??= []).push(uc)
    return acc
  }, {})

  const totalUseCases = useCases.length
  const totalBusinessUnits = Object.keys(grouped).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-800 rounded-full">
              <User className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back</h1>
              <p className="text-gray-400 mt-1">{user}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              <span>{totalUseCases} dashboards available</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full" />
            <span>{totalBusinessUnits} business units</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="space-y-12">
          {Object.entries(grouped).map(([businessUnit, cases]) => (
            <section key={businessUnit}>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {businessUnit}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                  {cases.length} dashboard{cases.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((uc) => {
                  const config = modeConfig[uc.mode]
                  const modeNumber = uc.mode.replace("mode", "")

                  return (
                    <Link
                      key={`${uc.name}-${uc.mode}`}
                      href={`/${uc.mode}?businessUnit=${encodeURIComponent(
                        uc.businessUnit
                      )}&useCase=${encodeURIComponent(
                        uc.name
                      )}&alertKeeper=${encodeURIComponent(uc.alertKeeper)}`}
                      className="group block"
                    >
                      <article
                        className={`
                          relative bg-gray-800 border-2 rounded-2xl p-6
                          transition-all duration-200 ease-out
                          hover:shadow-gray-700 hover:-translate-y-1
                          focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
                          ${config.bgColor}
                        `}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`
                              inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase
                              ${config.badgeColor}
                            `}
                          >
                            M{modeNumber}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-gray-400 transition-colors" />
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg text-white group-hover:text-gray-300 transition-colors">
                            {uc.name}
                          </h3>
                          <p className="text-sm text-gray-400">{uc.type}</p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-700">
                          <div className="flex items-center text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                            <span>Open Dashboard</span>
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-700">
          <p className="text-center text-sm text-gray-400">
            Need help? Contact your system administrator or visit our documentation.
          </p>
        </footer>
      </div>
    </div>
  )
}
