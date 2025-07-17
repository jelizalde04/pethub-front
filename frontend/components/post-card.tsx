"use client"

import { useState } from "react"
import { Heart, MoreHorizontal, Edit, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ImageModal } from "@/components/image-modal"
import { makeAuthenticatedRequest } from "@/utils/auth"

interface Post {
  id: string
  content: string
  image?: string
  likes: number
  createdAt: string
  updatedAt: string
}

interface PostCardProps {
  post: Post
  petName: string
  petImage?: string
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  disableLike?: boolean
}

export function PostCard({ post, petName, petImage, onEdit, onDelete, disableLike = false }: PostCardProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [currentLikes, setCurrentLikes] = useState(post.likes)
  const [isLiking, setIsLiking] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const handleLike = async () => {
    if (isLiking) return

    const selectedPetId = localStorage.getItem("selectedPetId")
    if (!selectedPetId) {
      console.error("No selected pet ID found")
      return
    }

    setIsLiking(true)

    try {
      if (liked) {
        // Remove like
        const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_DOS}/likes/remove`, {
          method: "DELETE",
          body: JSON.stringify({
            postId: post.id,
            petId: selectedPetId,
          }),
        })

        if (response.ok) {
          setLiked(false)
          setCurrentLikes((prev) => prev - 1)
        }
      } else {
        // Add like
        const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_DOS}/likes/add`, {
          method: "POST",
          body: JSON.stringify({
            postId: post.id,
            petId: selectedPetId,
          }),
        })

        if (response.ok) {
          setLiked(true)
          setCurrentLikes((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("Error handling like:", error)
    } finally {
      setIsLiking(false)
    }
  }

  // Mejorada lógica para detectar si fue editado
  // Solo considera editado si la diferencia entre creación y actualización es mayor a 1 minuto
  const isEdited = () => {
    const createdAt = new Date(post.createdAt).getTime()
    const updatedAt = new Date(post.updatedAt).getTime()
    const diffInMinutes = Math.abs(updatedAt - createdAt) / (1000 * 60)
    
    // Solo considera editado si la diferencia es mayor a 1 minuto
    return diffInMinutes > 1
  }

  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-4">
      {/* Post Header */}
      <div className="flex items-start justify-between">
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
          <div>
            <h4 className="text-white font-medium">{petName}</h4>
            <div className="flex items-center gap-2 text-sm text-[#8b949e]">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(post.createdAt)}</span>
              {isEdited() && (
                <>
                  <span>•</span>
                  <span className="text-[#6e7681]">edited</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[#8b949e] hover:text-white hover:bg-[#21262d]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#161b22] border-[#30363d] text-white">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(post)} className="hover:bg-[#21262d] cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit post
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(post.id)}
                  className="text-[#f85149] hover:bg-[#da3633] hover:bg-opacity-15 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content */}
      <div className="space-y-3">
        <p className="text-white leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Post Image */}
        {post.image && (
  <div className="rounded-lg overflow-hidden border border-[#30363d] bg-[#0d1117]">
    <div className="relative">
      <img
        src={post.image || "/placeholder.svg"}
        alt="Post image"
        className="w-full h-auto min-h-[250px] max-h-[600px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
        style={{ aspectRatio: 'auto' }}
        onClick={() => setImageModalOpen(true)}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = "/placeholder.svg?height=300&width=400"
        }}
      />
    </div>
  </div>
)}
      </div>

      {/* Post Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-[#30363d]">
        {disableLike ? (
          <div className="flex items-center gap-2 text-[#8b949e]">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">{currentLikes}</span>
          </div>
        ) : (
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 transition-colors ${
              liked ? "text-[#f85149]" : "text-[#8b949e] hover:text-[#f85149]"
            } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{currentLikes}</span>
          </button>
        )}
      </div>

      {/* Image Modal */}
      {post.image && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageUrl={post.image}
        />
      )}
    </div>
  )
}