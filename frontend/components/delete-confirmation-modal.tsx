"use client"

import { useState } from "react"
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#da3633] bg-opacity-15 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-[#f85149]" />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting || isLoading}
            className="text-[#8b949e] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-[#8b949e] mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isDeleting || isLoading}
              className="flex-1 bg-[#da3633] hover:bg-[#f85149] text-white"
            >
              {isDeleting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {confirmText}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting || isLoading}
              className="flex-1 border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
