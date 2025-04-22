'use client'
import { ConfusionMatrix } from 'react-confusion-matrix'

export default function NewConfusionMatrix({ data, labels, title }: {
  data: number[][]
  labels: string[]
  title: string
}) {
  return (
    <div className="relative h-full w-full">
      <h3 className="text-lg font-medium text-blue-200 mb-2">{title}</h3>
      <ConfusionMatrix 
        data={data}
        labels={labels}
        theme="dark"
        showStats={true}
        cellStyle={{ borderRadius: '4px' }}
        labelStyle={{ color: '#e5e7eb' }}
      />
    </div>
  )
}
