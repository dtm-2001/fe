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
}

// Enhanced mode configuration with colors
const modeConfig: Record<UseCase["mode"], { bgColor: string; badgeColor: string }> = {
  mode1: {
    bgColor: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  mode2: {
    bgColor: "bg-amber-50 border-amber-200",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  mode3: {
    bgColor: "bg-emerald-50 border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  mode4: {
    bgColor: "bg-red-50 border-red-200",
    badgeColor: "bg-red-100 text-red-800",
  },
}

// Fallback data to use when backend is unreachable or returns no dashboards
const fallbackUseCases: UseCase[] = [
  {
    name: "Sales Overview",
    mode: "mode1",
    type: "Summary Dashboard",
    businessUnit: "Sales",
  },
  {
    name: "Marketing Trends",
    mode: "mode2",
    type: "Analytics",
    businessUnit: "Marketing",
  },
  {
    name: "Support Tickets",
    mode: "mode3",
    type: "Live Queue",
    businessUnit: "Customer Success",
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

      // If offline, immediately use fallback data
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-96">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600 font-medium">
              Loading your dashboards...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state (only for non-load-related errors, if any)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
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

  // Group by business unit
  const grouped = useCases.reduce<Record<string, UseCase[]>>((acc, uc) => {
    const bu = uc.businessUnit || "Other"
    ;(acc[bu] ??= []).push(uc)
    return acc
  }, {})

  const totalUseCases = useCases.length
  const totalBusinessUnits = Object.keys(grouped).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back
              </h1>
              <p className="text-gray-600 mt-1">{user}</p>
            </div>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              <span>{totalUseCases} dashboards available</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <span>{totalBusinessUnits} business units</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="space-y-12">
          {Object.entries(grouped).map(([businessUnit, cases]) => (
            <section key={businessUnit}>
              {/* Business Unit Header */}
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {businessUnit}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {cases.length} dashboard{cases.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((useCase) => {
                  const config = modeConfig[useCase.mode]
                  const modeNumber = useCase.mode.replace("mode", "")

                  return (
                    <Link
                      key={`${useCase.name}-${useCase.mode}`}
                      href={`/${useCase.mode}?businessUnit=${encodeURIComponent(
                        useCase.businessUnit
                      )}&useCase=${encodeURIComponent(useCase.name)}`}
                      className="group block"
                    >
                      <article
                        className={`
                        relative bg-white border-2 rounded-2xl p-6 
                        transition-all duration-200 ease-out
                        hover:shadow-lg hover:shadow-slate-200 hover:-translate-y-1
                        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
                        ${config.bgColor}
                      `}
                      >
                        {/* Mode Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`
                            inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase
                            ${config.badgeColor}
                          `}
                          >
                            M{modeNumber}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-gray-700 transition-colors">
                            {useCase.name}
                          </h3>

                          <p className="text-sm text-gray-600">{useCase.type}</p>
                        </div>

                        {/* Action */}
                        <div className="mt-6 pt-4 border-t border-white border-opacity-50">
                          <div className="flex items-center text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
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
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            Need help? Contact your system administrator or visit our documentation.
          </p>
        </footer>
      </div>
    </div>
  )
}
