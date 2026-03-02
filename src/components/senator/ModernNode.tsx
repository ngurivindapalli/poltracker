'use client'

import { Handle, Position } from '@xyflow/react'

interface ModernNodeProps {
  data: {
    label: string
    type?: string
    newsCount?: number
    hasNewNews?: boolean
    onClick?: () => void
  }
}

const NODE_STYLES: Record<string, { bg: string; text: string; border: string; size: string }> = {
  senator: { bg: 'bg-blue-600', text: 'text-white', border: 'border-2 border-blue-700', size: 'px-5 py-4 text-base' },
  'family-prominent': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-2 border-yellow-400', size: 'px-5 py-4 text-base font-bold' },
  colleague: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border border-gray-300', size: 'px-3 py-2 text-sm' },
  family: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border border-pink-300', size: 'px-4 py-3 text-sm' },
  person: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border border-indigo-300', size: 'px-4 py-3 text-sm' }
}

export default function ModernNode({ data }: ModernNodeProps) {
  // Get node type from data (passed via node metadata or inferred)
  const nodeType = data.type || 'person'
  const style = NODE_STYLES[nodeType] || NODE_STYLES.person
  const newsCount = data.newsCount || 0
  const hasNewNews = data.hasNewNews || false

  // Special styling for prominent family members (gold accent)
  const isProminentFamily = nodeType === 'family-prominent'
  const goldAccent = isProminentFamily ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''

  return (
    <div 
      className={`rounded-xl ${style.size} ${style.bg} ${style.text} ${style.border} shadow-md font-medium min-w-[120px] text-center relative cursor-pointer transition-all ${goldAccent} ${
        hasNewNews ? 'ring-2 ring-yellow-400 ring-opacity-75 animate-pulse' : ''
      }`}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />
      <div className="whitespace-nowrap">{data.label}</div>
      {newsCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {newsCount > 9 ? '9+' : newsCount}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-400" />
    </div>
  )
}
