"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  PawPrint,
  Heart,
  UserPlus,
  UserMinus,
  Palette,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { makeAuthenticatedRequest } from "@/utils/auth"

interface Responsible {
  id: string
  name: string
  email: string
  password: string
  contact: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  image: string
  birthdate: string
  residence: string | null
  gender: string
  color: string | null
  responsibleId: string
  createdAt: string
  updatedAt: string
  responsible: Responsible
}

interface Post {
  id: string
  petId: string
  content: string
  image: string | null
  likes: number
  createdAt: string
  updatedAt: string
}

interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
}

interface FollowersData {
  petId: string
  followers_count: number
  followers: Array<{
    id: string
    name: string
    created_at: string
  }>
}

export default function PublicPetProfilePage() {
  const params = useParams()
  const petId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [pet, setPet] = useState<Pet | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [followersData, setFollowersData] = useState<FollowersData | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Check if user is authenticated and has selected a pet
    const authToken = localStorage.getItem("authToken")
    const selectedPetId = localStorage.getItem("selectedPetId")

    if (!authToken || !selectedPetId) {
      window.location.href = "/login"
      return
    }

    loadUserInfo()
    loadPetInfo()
    loadPetPosts()
    loadFollowersData()
  }, [petId])

  const loadUserInfo = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/getId`)
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.responsible)
      }
    } catch (error) {
      console.error("Error loading user info:", error)
    }
  }

  const loadPetInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/all`)
      const petsData = await response.json()

      if (Array.isArray(petsData)) {
        const foundPet = petsData.find((p) => p.id === petId)
        if (foundPet) {
          setPet(foundPet)
        } else {
          console.error("Pet not found")
          window.location.href = "/home"
        }
      }
    } catch (error) {
      console.error("Error loading pet info:", error)
      window.location.href = "/home"
    } finally {
      setIsLoading(false)
    }
  }

  const loadPetPosts = async () => {
    try {
      setLoadingPosts(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/all`)
      const allPosts = await response.json()

      if (Array.isArray(allPosts)) {
        const petPosts = allPosts.filter((post) => post.petId === petId)
        const sortedPosts = petPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPosts(sortedPosts)
      }
    } catch (error) {
      console.error("Error loading pet posts:", error)
      setPosts([])
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadFollowersData = async () => {
    try {
      const response = await fetch("http://184.73.83.78:7003/api/v1/followers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ petId }),
      })

      if (response.ok) {
        const data = await response.json()
        setFollowersData(data)

        // Check if current user is following this pet
        const selectedPetId = localStorage.getItem("selectedPetId")
        if (selectedPetId && data.followers) {
          const isCurrentlyFollowing = data.followers.some((follower: any) => follower.id === selectedPetId)
          setIsFollowing(isCurrentlyFollowing)
        }
      }
    } catch (error) {
      console.error("Error loading followers data:", error)
      setFollowersData({ petId, followers_count: 0, followers: [] })
    }
  }

  const handleFollowToggle = async () => {
    const selectedPetId = localStorage.getItem("selectedPetId")
    if (!selectedPetId || followLoading) return

    setFollowLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch("http://184.73.83.78:7002/api/v1/followers", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            followerId: selectedPetId,
            petId: petId,
          }),
        })

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
        const response = await fetch("http://184.73.83.78:7001/api/v1/followers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            followerId: selectedPetId,
            petId: petId,
          }),
        })

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
      setFollowLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    const selectedPetId = localStorage.getItem("selectedPetId")
    if (!selectedPetId) return

    const isLiked = likedPosts.has(postId)

    try {
      if (isLiked) {
        // Remove like
        const response = await fetch("http://54.146.149.107:6002/likes/remove", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: postId,
            petId: selectedPetId,
          }),
        })

        if (response.ok) {
          setLikedPosts((prev) => {
            const newSet = new Set(prev)
            newSet.delete(postId)
            return newSet
          })
          setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes: post.likes - 1 } : post)))
        }
      } else {
        // Add like
        const response = await fetch("http://54.146.149.107:6001/likes/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: postId,
            petId: selectedPetId,
          }),
        })

        if (response.ok) {
          setLikedPosts((prev) => new Set(prev).add(postId))
          setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
        }
      }
    } catch (error) {
      console.error("Error handling like:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
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

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate)
    const today = new Date()
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())

    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? "s" : ""} old`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      if (months === 0) {
        return `${years} year${years !== 1 ? "s" : ""} old`
      } else {
        return `${years} year${years !== 1 ? "s" : ""} and ${months} month${months !== 1 ? "s" : ""} old`
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-[#8b949e]">Loading pet profile...</p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Pet not found</h2>
          <p className="text-[#8b949e] mb-4">The pet profile you're looking for doesn't exist.</p>
          <Button
            onClick={() => (window.location.href = "/home")}
            className="bg-[#238636] hover:bg-[#2ea043] text-white"
          >
            Go back to home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Simple Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (window.location.href = "/home")}
              className="text-[#8b949e] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => (window.location.href = "/home")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <PawPrint className="h-8 w-8 text-white" />
              <span className="text-white font-semibold text-xl">PetHub</span>
            </button>
            <div className="flex items-center gap-2 text-[#58a6ff]">
              <PawPrint className="h-4 w-4" />
              <span className="text-sm">Pet Profile</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => (window.location.href = "/home")}
              className="text-[#8b949e] hover:text-white transition-colors"
            >
              Home
            </button>

            <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#30363d]">
              <img
                src={userInfo?.avatar || "/placeholder.svg?height=36&width=36"}
                alt="User avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=36&width=36"
                }}
              />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pet Image */}
          <div className="lg:col-span-1">
            <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square">
                  <img
                    src={pet.image || "/placeholder.svg?height=500&width=500"}
                    alt={`${pet.name}'s photo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=500&width=500"
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pet Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-white mb-2">{pet.name}</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-[#21262d] text-[#8b949e] capitalize">{pet.gender}</Badge>
                    <span className="text-[#8b949e]">•</span>
                    <Badge className="bg-[#21262d] text-[#8b949e]">{pet.breed}</Badge>
                  </div>
                  {pet.color && (
                    <div className="inline-flex items-center gap-2 bg-[#21262d] px-3 py-1 rounded-full border border-[#30363d] mb-4">
                      <Palette className="w-3 h-3 text-[#58a6ff]" />
                      <span className="text-sm text-[#8b949e] capitalize">{pet.color}</span>
                    </div>
                  )}
                </div>

                {/* Pet Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-[#58a6ff]" />
                      <div>
                        <p className="text-[#8b949e] text-xs">Species</p>
                        <p className="text-white text-sm font-medium capitalize">{pet.species}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#58a6ff]" />
                      <div>
                        <p className="text-[#8b949e] text-xs">Birthday</p>
                        <p className="text-white text-sm font-medium">
                          {new Date(pet.birthdate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#58a6ff]" />
                      <div>
                        <p className="text-[#8b949e] text-xs">Breed</p>
                        <p className="text-white text-sm font-medium">{pet.breed}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#58a6ff]" />
                      <div>
                        <p className="text-[#8b949e] text-xs">Location</p>
                        <p className="text-white text-sm font-medium">{pet.residence || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Followers */}
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <Users className="h-5 w-5 text-[#58a6ff]" />
                    <div className="text-center">
                      <span className="text-lg font-bold text-white">{followersData?.followers_count || 0}</span>
                      <span className="text-sm text-[#8b949e] ml-2">Followers</span>
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                <Button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`w-full ${
                    isFollowing
                      ? "bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
                      : "bg-[#238636] hover:bg-[#2ea043] text-white"
                  }`}
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isFollowing ? (
                    <UserMinus className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {followLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
                </Button>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Owner</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={pet.responsible.avatar || "/placeholder.svg?height=48&width=48"}
                    alt={pet.responsible.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#30363d]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=48&width=48"
                    }}
                  />
                  <div>
                    <p className="text-white font-medium">{pet.responsible.name}</p>
                    <p className="text-[#8b949e] text-sm">{pet.responsible.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Posts</h2>
            <Badge className="bg-[#21262d] text-[#8b949e]">{posts.length} posts</Badge>
          </div>

          {loadingPosts ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
              <p className="text-[#8b949e]">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-12 text-center">
                <PawPrint className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-[#8b949e]">{pet.name} hasn't shared anything yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="bg-[#161b22] border-[#30363d]">
                  <CardContent className="p-6">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={pet.image || "/placeholder.svg?height=40&width=40"}
                        alt={pet.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#30363d]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=40&width=40"
                        }}
                      />
                      <div>
                        <h4 className="text-white font-medium">{pet.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                          <Calendar className="h-3 w-3" />
                          <span>{formatTimeAgo(post.createdAt)}</span>
                          {post.createdAt !== post.updatedAt && (
                            <>
                              <span>•</span>
                              <span className="text-[#6e7681]">edited</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="space-y-3 mb-4">
                      <p className="text-white leading-relaxed whitespace-pre-wrap">{post.content}</p>

                      {/* Post Image */}
                      {post.image && (
                        <div className="rounded-lg overflow-hidden border border-[#30363d]">
                          <img
                            src={post.image || "/placeholder.svg"}
                            alt="Post image"
                            className="w-full h-auto max-h-96 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=300&width=400"
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 pt-2 border-t border-[#30363d]">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          likedPosts.has(post.id) ? "text-[#f85149]" : "text-[#8b949e] hover:text-[#f85149]"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                        <span className="text-sm font-medium">{post.likes}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
