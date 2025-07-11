"use client"

import { useState, useEffect } from "react"
import { X, Users, Loader2, UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { makeAuthenticatedRequest } from "@/utils/auth"


interface Follower {
  id: string
  name: string
  created_at: string
}

interface FollowersData {
  petId: string
  followers_count: number
  followers: Follower[]
}

interface FollowersModalProps {
  isOpen: boolean
  petName: string
  petId: string
  onClose: () => void
}

export function FollowersModal({ isOpen, petName, petId, onClose }: FollowersModalProps) {
  const [followersData, setFollowersData] = useState<FollowersData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadFollowers()
    }
  }, [isOpen, petId])

const loadFollowers = async () => {
  setIsLoading(true)
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_TRES}/api/v1/followers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          petId: petId,
        }),
      }
    )

    if (response.ok) {
      const data = await response.json()
      setFollowersData(data)

      // Check if current user is following this pet
      const selectedPetId = localStorage.getItem("selectedPetId")
      if (selectedPetId && data.followers) {
        const isCurrentlyFollowing = data.followers.some(
          (follower: Follower) => follower.id === selectedPetId
        )
        setIsFollowing(isCurrentlyFollowing)
      }
    } else {
      console.error("Error loading followers")
      setFollowersData({ petId, followers_count: 0, followers: [] })
    }
  } catch (error) {
    console.error("Error loading followers:", error)
    setFollowersData({ petId, followers_count: 0, followers: [] })
  } finally {
    setIsLoading(false)
  }
}

  const handleFollowToggle = async () => {
    const selectedPetId = localStorage.getItem("selectedPetId")
    if (!selectedPetId) {
      console.error("No selected pet ID found")
      return
    }

    setFollowingLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const response = await makeAuthenticatedRequest(
  `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_DOS}/api/v1/followers`,
  {
    method: "DELETE",
    body: JSON.stringify({
      followerId: selectedPetId,
      petId: petId,
    }),
  }
)

        if (response.ok) {
          setIsFollowing(false)
          setFollowersData((prev) =>
            prev
              ? {
                  ...prev,
                  followers_count: prev.followers_count - 1,
                  followers: prev.followers.filter((follower) => follower.id !== selectedPetId),
                }
              : null,
          )
        }
      } else {
        // Follow
        const response = await makeAuthenticatedRequest(
  `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_UNO}/api/v1/followers`,
  {
    method: "POST",
    body: JSON.stringify({
      followerId: selectedPetId,
      petId: petId,
    }),
  }
)
        if (response.ok) {
          setIsFollowing(true)
          setFollowersData((prev) =>
            prev
              ? {
                  ...prev,
                  followers_count: prev.followers_count + 1,
                  followers: [
                    ...prev.followers,
                    {
                      id: selectedPetId,
                      name: "You",
                      created_at: new Date().toISOString(),
                    },
                  ],
                }
              : null,
          )
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setFollowingLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "today"
    if (diffInDays === 1) return "yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#58a6ff]" />
            <h2 className="text-lg font-semibold text-white">
              {petName}'s Followers ({followersData?.followers_count || 0})
            </h2>
          </div>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Follow/Unfollow Button */}
        <div className="p-4 border-b border-[#30363d]">
          <Button
            onClick={handleFollowToggle}
            disabled={followingLoading}
            className={`w-full ${
              isFollowing
                ? "bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
                : "bg-[#238636] hover:bg-[#2ea043] text-white"
            }`}
          >
            {followingLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isFollowing ? (
              <UserMinus className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {followingLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
              <p className="text-[#8b949e]">Loading followers...</p>
            </div>
          ) : !followersData || followersData.followers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-[#30363d] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">No followers yet</h3>
              <p className="text-[#8b949e] text-sm">When people start following {petName}, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {followersData.followers.map((follower) => (
                <div key={follower.id} className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#30363d] flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#8b949e]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{follower.name}</p>
                      <p className="text-[#8b949e] text-sm">Followed {formatTimeAgo(follower.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
