"use client"

import { Copy } from "lucide-react"
import { useState } from "react"

interface PhoneDisplayProps {
  phoneNumber: string
}

export function PhoneDisplay({ phoneNumber }: PhoneDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy phone number:", error)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] rounded-lg p-3">
      <span className="text-white font-mono text-sm flex-1">{phoneNumber}</span>
      <button
        onClick={handleCopy}
        className="p-1 text-[#8b949e] hover:text-white hover:bg-[#30363d] rounded transition-colors"
        title={copied ? "Copied!" : "Copy"}
      >
        <Copy className="h-3 w-3" />
      </button>
      {copied && <span className="text-xs text-[#2ea043] bg-[#238636] bg-opacity-15 px-2 py-1 rounded">Copied!</span>}
    </div>
  )
}
