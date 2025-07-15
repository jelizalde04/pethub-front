"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Upload, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { makeAuthenticatedRequest } from "@/utils/auth"

interface Post {
  id: string
  petId: string
  content: string
  image: string
  likes: number
  createdAt: string
  updatedAt: string
}

interface EditPostModalProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedPost: Post) => void
}

export function EditPostModal({ post, isOpen, onClose, onSuccess }: EditPostModalProps) {
  const [content, setContent] = useState("")
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (post && isOpen) {
      setContent(post.content)
      setImagePreview(post.image)
      setNewImage(null)
      setError(null)
      setShowSuccess(false)
    }
  }, [post, isOpen])

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

      setNewImage(file)
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
    if (!post) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("content", content)

      if (newImage) {
        formData.append("image", newImage)
      }

      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/update/${post.id}`,
        {
          method: "PUT",
          body: formData,
        },
      )

      if (response.ok) {
        const updatedPost = await response.json()
        setShowSuccess(true)

        // Show success message for 1 second then close
        setTimeout(() => {
          setShowSuccess(false)
          onSuccess(updatedPost)
          onClose()
        }, 1000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update post")
      }
    } catch (error) {
      console.error("Error updating post:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="text-lg font-semibold text-white">Edit Post</h2>
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
              <span className="text-sm font-medium">Post updated successfully!</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
            <Label htmlFor="content" className="block text-sm font-medium text-[#f0f6fc] mb-2">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-[#0d1117] border-[#30363d] text-white placeholder-[#8b949e] focus:border-[#1f6feb] focus:ring-[#1f6feb] min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Image */}
          <div>
            <Label className="block text-sm font-medium text-[#f0f6fc] mb-2">Image</Label>

            {imagePreview && (
              <div className="mb-3">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Post preview"
                  className="w-full max-h-48 object-cover rounded-md border border-[#30363d]"
                />
              </div>
            )}

            <div className="border-2 border-dashed border-[#30363d] rounded-lg p-4 text-center">
              <Upload className="h-6 w-6 text-[#8b949e] mx-auto mb-2" />
              <p className="text-sm text-[#8b949e] mb-2">{newImage ? "Change image" : "Upload new image (optional)"}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isLoading}
                className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
              >
                Choose file
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
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
