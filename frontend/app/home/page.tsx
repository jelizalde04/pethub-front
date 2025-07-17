"use client"

import { useEffect, useState } from "react"
import { Loader2, Heart, Calendar, MapPin, PawPrint, Users, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { useSearch } from "@/hooks/useSearch"

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
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  
  const { filteredData: filteredPosts, totalResults } = useSearch({
    data: posts,
    searchFields: ['content', 'pet.name', 'pet.breed', 'pet.species', 'pet.responsible.name'],
    searchQuery
  })

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    const currentSelectedPetId = localStorage.getItem("selectedPetId")

    if (!authToken) {
      window.location.href = "/login"
      return
    }

    if (!currentSelectedPetId) {
      window.location.href = "/pets"
      return
    }
    setSelectedPetId(currentSelectedPetId)

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

      const petsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/all`)
      const petsData = await petsResponse.json()
      setPets(Array.isArray(petsData) ? petsData : [])

      const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/all`)
      const postsData = await postsResponse.json()

      if (Array.isArray(postsData) && Array.isArray(petsData)) {
        const postsWithPets = postsData.map((post) => {
          const pet = petsData.find((p) => p.id === post.petId)
          return { ...post, pet }
        })

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

  // Función para detectar si un post fue realmente editado
  const isPostEdited = (post: Post) => {
    const createdAt = new Date(post.createdAt).getTime()
    const updatedAt = new Date(post.updatedAt).getTime()
    const diffInMinutes = Math.abs(updatedAt - createdAt) / (1000 * 60)
    
    // Solo considera editado si la diferencia es mayor a 1 minuto
    return diffInMinutes > 1
  }

  const handleLike = async (postId: string, postPetId: string) => {
    if (!selectedPetId) {
      console.error("No selected pet ID found for liking.")
      return
    }

    if (selectedPetId === postPetId) {
      console.warn("Cannot like your own post.")
      return
    }

    const isLiked = likedPosts.has(postId)

    try {
      if (isLiked) {
        // Attempt to remove like
        const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_DOS}/likes/remove`, {
          method: "DELETE",
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
        } else {
          const errorText = await response.text()
          console.error("Error removing like:", response.status, errorText)
          // If backend says like doesn't exist, ensure client state reflects that
          if (response.status === 400 && errorText.includes("Like does not exist")) {
            setLikedPosts((prev) => {
              const newSet = new Set(prev)
              newSet.delete(postId)
              return newSet
            })
            // No need to decrement likes if it didn't exist on backend
          }
        }
      } else {
        // Attempt to add like
        const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_DOS}/likes/add`, {
          method: "POST",
          body: JSON.stringify({
            postId: postId,
            petId: selectedPetId,
          }),
        })

        if (response.ok) {
          setLikedPosts((prev) => new Set(prev).add(postId))
          setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
        } else {
          const errorText = await response.text()
          console.error("Error adding like:", response.status, errorText)
          // If backend says like already exists, ensure client state reflects that
          if (response.status === 400 && errorText.includes("Like already exists")) {
            setLikedPosts((prev) => new Set(prev).add(postId))
            // No need to increment likes if it already existed on backend
          }
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
      <Header 
        userInfo={userInfo} 
        currentPage="home"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to PetHub Community! 🐾</h1>
          <p className="text-[#8b949e] text-lg">Discover amazing pets and their stories from around the world</p>
          {searchQuery && (
            <div className="mt-4 text-[#8b949e]">
              {totalResults} results for "{searchQuery}"
            </div>
          )}
        </div>

        <div className="space-y-6">
          {loadingPosts ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
              <p className="text-[#8b949e]">Loading community posts...</p>
            </div>
          ) : filteredPosts.length === 0 && !searchQuery ? (
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No posts available</h3>
                <p className="text-[#8b949e]">Be the first to share something amazing!</p>
              </CardContent>
            </Card>
          ) : searchQuery && filteredPosts.length === 0 ? (
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-[#8b949e]">No posts found for "{searchQuery}". Try a different search term.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="bg-[#161b22] border-[#30363d] hover:border-[#58a6ff]/30 transition-colors">
                <CardContent className="p-6">
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
                        {isPostEdited(post) && (
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

                  <div className="mb-4">
                    <p className="text-white leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

                    {post.image && (
                      <div className="rounded-lg overflow-hidden border border-[#30363d] mt-3">
                        <div className="relative bg-[#0d1117] flex items-center justify-center min-h-[250px]">
                          <img
                            src={post.image}
                            alt="Post image"
                            className="max-w-full max-h-[500px] w-auto h-auto object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=300&width=400"
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-[#30363d]">
                    <button
                      onClick={() => post.petId && handleLike(post.id, post.petId)}
                      disabled={selectedPetId === post.petId}
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(post.id) ? "text-[#f85149]" : "text-[#8b949e] hover:text-[#f85149]"
                      } ${selectedPetId === post.petId ? "opacity-50 cursor-not-allowed" : ""}`}
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

        {filteredPosts.length > 0 && (
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