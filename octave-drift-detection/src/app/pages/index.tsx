'use client'
import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [businessUnit, setBusinessUnit] = useState<string>('')
  const [useCase, setUseCase] = useState<string>('')
  const [shortCode, setShortCode] = useState<string>('')
  const [mode, setMode] = useState<string>('')
  const [useCaseOptions, setUseCaseOptions] = useState<string[]>([])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!businessUnit || !useCase || !mode) {
      alert('Please fill in all required fields')
      return
    }
    
    const finalShortCode = shortCode || `${businessUnit.substring(0,2)}-${useCase.substring(0,2)}`
    
    router.push(`/${mode.replace('.html', '')}?businessUnit=${businessUnit}&useCase=${useCase}&shortCode=${finalShortCode}`)
  }

  const handleBusinessUnitChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value
    setBusinessUnit(unit)
    setUseCase('')
    
    if (unit === 'CCS') {
      setUseCaseOptions(['Distribution Efficiency', 'MT Promo'])
    } else if (unit === 'JMSL') {
      setUseCaseOptions(['Customer Churn'])
    } else {
      setUseCaseOptions([])
    }
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
          <h2 className="text-2xl font-semibold text-[#F910B2] mb-6 text-center">
            Select Your Options
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="businessUnit" className="block text-sm font-medium text-gray-700">
                Business Unit
              </label>
              <select
                id="businessUnit"
                value={businessUnit}
                onChange={handleBusinessUnitChange}
                className="mt-1 block w-full border-[#F910B2] rounded-md shadow-sm py-2 px-3 border focus:outline-none focus:ring-[#F910B2] focus:border-[#F910B2]"
              >
                <option value="">Select Business Unit</option>
                <option value="CCS">CCS</option>
                <option value="JMSL">JMSL</option>
              </select>
            </div>

            <div>
              <label htmlFor="useCase" className="block text-sm font-medium text-gray-700">
                Use Case
              </label>
              <select
                id="useCase"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                disabled={!businessUnit}
                className="mt-1 block w-full border-[#F910B2] rounded-md shadow-sm py-2 px-3 border focus:outline-none focus:ring-[#F910B2] focus:border-[#F910B2]"
              >
                <option value="">{businessUnit ? 'Select Use Case' : 'Select Business Unit first'}</option>
                {useCaseOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="shortCode" className="block text-sm font-medium text-gray-700">
                Use Case Short Code
              </label>
              <input
                type="text"
                id="shortCode"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="mt-1 block w-full border-[#F910B2] rounded-md shadow-sm py-2 px-3 border focus:outline-none focus:ring-[#F910B2] focus:border-[#F910B2]"
                placeholder="e.g. CS-DE"
              />
            </div>

            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                Mode
              </label>
              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mt-1 block w-full border-[#F910B2] rounded-md shadow-sm py-2 px-3 border focus:outline-none focus:ring-[#F910B2] focus:border-[#F910B2]"
              >
                <option value="">Select Mode</option>
                <option value="mode1">OCTAVE RG</option>
                <option value="mode2">Other RG</option>
                <option value="mode3">OCTAVE CL</option>
                <option value="mode4">Other CL</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#96FFE6] hover:bg-[#85e6d9] text-[#F910B2] font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center"
              >
                <i className="fas fa-tv mr-2"></i> Monitor Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}