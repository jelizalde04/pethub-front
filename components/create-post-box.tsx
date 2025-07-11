"use client"

import { Plus, Camera } from "lucide-react"

interface CreatePostBoxProps {
  petName: string
  petImage: string
  onClick: () => void
}

export function CreatePostBox({ petName, petImage, onClick }: CreatePostBoxProps) {
  return (
    <div
      onClick={onClick}
      className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-6 cursor-pointer hover:bg-[#30363d] transition-colors"
    >
      <div className="flex items-center gap-3">
        <img
          src={petImage || "/placeholder.svg?height=40&width=40"}
          alt={petName}
          className="w-10 h-10 rounded-full object-cover border-2 border-[#30363d]"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=40&width=40"
          }}
        />
        <div className="flex-1">
          <p className="text-[#8b949e] text-sm">What's {petName} up to?</p>
        </div>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-[#8b949e]" />
          <Plus className="h-5 w-5 text-[#58a6ff]" />
        </div>
      </div>
    </div>
  )
}
