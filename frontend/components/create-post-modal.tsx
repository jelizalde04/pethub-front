"use client"

import type React from "react"

import { useState } from "react"
import { X, Upload, Loader2, AlertCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { makeAuthenticatedRequest } from "@/utils/auth"

interface CreatePostModalProps {
  isOpen: boolean
  petId: string
  petName: string
  petImage: string
  onClose: () => void
  onSuccess: (newPost: any) => void
}

export function CreatePostModal({ isOpen, petId, petName, petImage, onClose, onSuccess }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.")
        return
      }

      setImage(file)
      setError(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && !image) {
      setError("Please add some content or an image to your post.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("content", content)

      if (image) {
        formData.append("image", image)
      }

      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/create/${petId}`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newPost = await response.json()
        setShowSuccess(true)

        // Show success message for 1 second then close
        setTimeout(() => {
          setShowSuccess(false)
          onSuccess(newPost)
          handleClose()
        }, 1000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setContent("")
      setImage(null)
      setImagePreview(null)
      setError(null)
      setShowSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="text-lg font-semibold text-white">Create Post</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-[#8b949e] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="p-4 bg-[#238636] bg-opacity-15 border-b border-[#238636]">
            <div className="flex items-center gap-2 text-[#238636]">
              <div className="w-4 h-4 rounded-full bg-[#238636] flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm font-medium">Post created successfully!</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Pet Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={petImage || "/placeholder.svg?height=40&width=40"}
              alt={petName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#30363d]"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=40&width=40"
              }}
            />
            <div>
              <p className="text-white font-medium">{petName}</p>
              <p className="text-[#8b949e] text-sm">Creating a new post</p>
            </div>
          </div>

          {error && (
            <div className="bg-[#da3633] bg-opacity-15 border border-[#f85149] rounded-md p-3 text-sm">
              <div className="flex items-center gap-2 text-[#f85149]">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's ${petName} up to?`}
              className="w-full bg-[#0d1117] border-[#30363d] text-white placeholder-[#8b949e] focus:border-[#1f6feb] focus:ring-[#1f6feb] min-h-[120px] resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Post preview"
                className="w-full max-h-64 object-cover rounded-md border border-[#30363d]"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null)
                  setImagePreview(null)
                }}
                className="absolute top-2 right-2 bg-[#161b22] bg-opacity-80 backdrop-blur-sm rounded-full p-1 text-[#8b949e] hover:text-white"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Image Upload */}
          <div className="border-2 border-dashed border-[#30363d] rounded-lg p-4 text-center">
            <Upload className="h-6 w-6 text-[#8b949e] mx-auto mb-2" />
            <p className="text-sm text-[#8b949e] mb-2">Add a photo to your post</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("post-image-upload")?.click()}
              disabled={isLoading}
              className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
            >
              Choose Photo
            </Button>
            <input
              id="post-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading || (!content.trim() && !image)}
              className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
