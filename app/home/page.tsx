"use client"

import { useEffect, useState } from "react"
import { Loader2, Heart, Calendar, MapPin, PawPrint, Users, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
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

interface PostWithPet extends Post {
  pet?: Pet
}

interface UserInfo {
  id: string
  name: string
  email: string
  avatar: string | null
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [posts, setPosts] = useState<PostWithPet[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Check if user is authenticated and has selected a pet
    const authToken = localStorage.getItem("authToken")
    const selectedPetId = localStorage.getItem("selectedPetId")

    if (!authToken) {
      window.location.href = "/login"
      return
    }

    if (!selectedPetId) {
      window.location.href = "/pets"
      return
    }

    loadUserInfo()
    loadGlobalFeed()
  }, [])

  const loadUserInfo = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/getId`)
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.responsible)
      }
    } catch (error) {
      console.error("Error loading user info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGlobalFeed = async () => {
    try {
      setLoadingPosts(true)

      // Load all pets
      const petsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/all`)
      const petsData = await petsResponse.json()
      setPets(Array.isArray(petsData) ? petsData : [])

      // Load all posts
      const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/all`)
      const postsData = await postsResponse.json()

      if (Array.isArray(postsData) && Array.isArray(petsData)) {
        // Combine posts with pet information
        const postsWithPets = postsData.map((post) => {
          const pet = petsData.find((p) => p.id === post.petId)
          return { ...post, pet }
        })

        // Sort by creation date (newest first)
        const sortedPosts = postsWithPets.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        setPosts(sortedPosts)
      }
    } catch (error) {
      console.error("Error loading global feed:", error)
      setPosts([])
    } finally {
      setLoadingPosts(false)
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

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const handlePetClick = (petId: string) => {
    window.location.href = `/public-pet/${petId}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-[#8b949e]">Loading PetHub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header userInfo={userInfo} currentPage="home" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to PetHub Community! 🐾</h1>
          <p className="text-[#8b949e] text-lg">Discover amazing pets and their stories from around the world</p>
        </div>

        {/* Global Feed */}
        <div className="space-y-6">
          {loadingPosts ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
              <p className="text-[#8b949e]">Loading community posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No posts available</h3>
                <p className="text-[#8b949e]">Be the first to share something amazing!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="bg-[#161b22] border-[#30363d] hover:border-[#58a6ff]/30 transition-colors">
                <CardContent className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={post.pet?.image || "/placeholder.svg?height=48&width=48"}
                        alt={post.pet?.name || "Pet"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#30363d] cursor-pointer hover:border-[#58a6ff] transition-colors"
                        onClick={() => post.pet && handlePetClick(post.pet.id)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => post.pet && handlePetClick(post.pet.id)}
                          className="text-[#58a6ff] hover:underline font-semibold text-lg transition-colors"
                        >
                          {post.pet?.name || "Unknown Pet"}
                        </button>
                        <Badge className="bg-[#21262d] text-[#8b949e] text-xs">{post.pet?.species || "Pet"}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#8b949e]">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        {post.createdAt !== post.updatedAt && (
                          <>
                            <span>•</span>
                            <span className="text-[#6e7681]">edited</span>
                          </>
                        )}
                        {post.pet?.residence && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{post.pet.residence}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#8b949e]">by {post.pet?.responsible?.name || "Unknown Owner"}</p>
                      <p className="text-xs text-[#6e7681]">{post.pet?.responsible?.email}</p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-white leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

                    {/* Post Image */}
                    {post.image && (
                      <div className="rounded-lg overflow-hidden border border-[#30363d]">
                        <img
                          src={post.image || "/placeholder.svg?height=300&width=400"}
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
                  <div className="flex items-center gap-6 pt-4 border-t border-[#30363d]">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(post.id) ? "text-[#f85149]" : "text-[#8b949e] hover:text-[#f85149]"
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                      <span className="font-medium">{post.likes}</span>
                    </button>

                    <button
                      onClick={() => post.pet && handlePetClick(post.pet.id)}
                      className="flex items-center gap-2 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                    >
                      <Users className="h-5 w-5" />
                      <span>View Profile</span>
                    </button>

                    <div className="flex items-center gap-2 text-[#8b949e]">
                      <PawPrint className="h-4 w-4" />
                      <span className="text-sm">{post.pet?.breed || "Mixed breed"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More Button */}
        {posts.length > 0 && (
          <div className="text-center mt-8">
            <Button
              onClick={loadGlobalFeed}
              className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Refresh Feed
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
