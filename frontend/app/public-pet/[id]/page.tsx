"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Loader2,
  MapPin,
  Calendar,
  Users,
  PawPrint,
  Heart,
  UserPlus,
  UserMinus,
  Palette,
  Award,
  X,
  Settings,
  Bell,
  User,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    created_at?: string
  }>
}

interface FollowerWithImage {
  id: string
  name: string
  image: string
  created_at?: string
  isFollowing?: boolean
  isOwnPet?: boolean
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
  const [followersWithImages, setFollowersWithImages] = useState<FollowerWithImage[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  // likedPosts will now only track likes made in the current session
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [followersModalOpen, setFollowersModalOpen] = useState(false)
  const [isOwnPet, setIsOwnPet] = useState(false)
  const [allPets, setAllPets] = useState<Pet[]>([])
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [followLoadingStates, setFollowLoadingStates] = useState<Record<string, boolean>>({})
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [editPostModal, setEditPostModal] = useState<{ isOpen: boolean; post: Post | null }>({
    isOpen: false,
    post: null,
  })
  const [deletePostModal, setDeletePostModal] = useState<{ isOpen: boolean; postId: string | null }>({
    isOpen: false,
    postId: null,
  })
  const [deletePetModal, setDeletePetModal] = useState<boolean>(false)
  const [followersModal, setFollowersModal] = useState<boolean>(false)
  const [createPostModal, setCreatePostModal] = useState<boolean>(false)
  const [editPetModal, setEditPetModal] = useState<boolean>(false)
  const [followersCount, setFollowersCount] = useState<number>(0)

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    const currentSelectedPetId = localStorage.getItem("selectedPetId")

    if (!authToken || !currentSelectedPetId) {
      window.location.href = "/login"
      return
    }
    setSelectedPetId(currentSelectedPetId)

    loadUserInfo()
    loadAllPets()
    loadPetInfo()
    loadPetPosts()
    loadFollowersData()
    // Removed loadLikedPosts function as the endpoint is not valid for initial load
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

  const loadAllPets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/all`)
      const petsData = await response.json()

      if (Array.isArray(petsData)) {
        setAllPets(petsData)
      }
    } catch (error) {
      console.error("Error loading all pets:", error)
      setAllPets([])
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

          const currentSelectedPetId = localStorage.getItem("selectedPetId")
          setIsOwnPet(foundPet.id === currentSelectedPetId)
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
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_TRES}/api/v1/followers?petId=${petId}`,
        {
          method: "GET",
        },
      )

      if (response.ok) {
        const data = await response.json()
        setFollowersData(data)
        setFollowersCount(data.followers_count)

        const currentSelectedPetId = localStorage.getItem("selectedPetId")
        if (currentSelectedPetId && data.followers) {
          const isCurrentlyFollowing = data.followers.some((follower: any) => follower.id === currentSelectedPetId)
          setIsFollowing(isCurrentlyFollowing)
        }
      } else {
        console.error("Error loading followers data, status:", response.status)
        setFollowersData({ petId, followers_count: 0, followers: [] })
        setFollowersCount(0)
      }
    } catch (error) {
      console.error("Error loading followers data:", error)
      setFollowersData({ petId, followers_count: 0, followers: [] })
      setFollowersCount(0)
    }
  }

  // loadLikedPosts function removed as per user's request (endpoint not valid for initial load)

  const checkFollowingStates = async (followerIds: string[]) => {
    const currentSelectedPetId = localStorage.getItem("selectedPetId")
    if (!currentSelectedPetId) return

    const states: Record<string, boolean> = {}

    for (const followerId of followerIds) {
      try {
        const response = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_TRES}/api/v1/followers?petId=${followerId}`,
          {
            method: "GET",
          },
        )

        if (response.ok) {
          const data = await response.json()
          const isFollowing = data.followers?.some((follower: any) => follower.id === currentSelectedPetId) || false
          states[followerId] = isFollowing
        } else {
          states[followerId] = false
        }
      } catch (error) {
        console.error(`Error checking follow state for ${followerId}:`, error)
        states[followerId] = false
      }
    }

    setFollowingStates(states)
  }

  useEffect(() => {
    if (followersData && allPets.length > 0) {
      const currentSelectedPetId = localStorage.getItem("selectedPetId")

      const followersWithImagesData = followersData.followers.map((follower) => {
        const petData = allPets.find((pet) => pet.id === follower.id)
        const isOwnPetFollower = follower.id === currentSelectedPetId

        return {
          id: follower.id,
          name: follower.name,
          image: petData?.image || "/placeholder.svg?height=40&width=40",
          created_at: follower.created_at,
          isOwnPet: isOwnPetFollower,
        }
      })

      setFollowersWithImages(followersWithImagesData)

      const followerIds = followersWithImagesData.filter((f) => !f.isOwnPet).map((f) => f.id)

      if (followerIds.length > 0) {
        checkFollowingStates(followerIds)
      }
    }
  }, [followersData, allPets])

  const handleFollowToggle = async () => {
    if (!selectedPetId || followLoading || isOwnPet) return

    setFollowLoading(true)

    try {
      if (isFollowing) {
        const response = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_DOS}/api/v1/followers`,
          {
            method: "DELETE",
            body: JSON.stringify({
              followerId: selectedPetId,
              petId: petId,
            }),
          },
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
          setFollowersCount((prev) => prev - 1)
        } else {
          console.error("Error unfollowing, status:", response.status)
        }
      } else {
        const response = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_UNO}/api/v1/followers`,
          {
            method: "POST",
            body: JSON.stringify({
              followerId: selectedPetId,
              petId: petId,
            }),
          },
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
          setFollowersCount((prev) => prev + 1)
        } else {
          console.error("Error following, status:", response.status)
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleIndividualFollowToggle = async (targetPetId: string) => {
    if (!selectedPetId || followLoadingStates[targetPetId]) return

    setFollowLoadingStates((prev) => ({ ...prev, [targetPetId]: true }))

    try {
      const isCurrentlyFollowing = followingStates[targetPetId]

      if (isCurrentlyFollowing) {
        const response = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_DOS}/api/v1/followers`,
          {
            method: "DELETE",
            body: JSON.stringify({
              followerId: selectedPetId,
              petId: targetPetId,
            }),
          },
        )

        if (response.ok) {
          setFollowingStates((prev) => ({ ...prev, [targetPetId]: false }))
        } else {
          console.error("Error unfollowing individual pet, status:", response.status)
        }
      } else {
        const response = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_UNO}/api/v1/followers`,
          {
            method: "POST",
            body: JSON.stringify({
              followerId: selectedPetId,
              petId: targetPetId,
            }),
          },
        )

        if (response.ok) {
          setFollowingStates((prev) => ({ ...prev, [targetPetId]: true }))
        } else {
          console.error("Error following individual pet, status:", response.status)
        }
      }
    } catch (error) {
      console.error("Error toggling individual follow:", error)
    } finally {
      setFollowLoadingStates((prev) => ({ ...prev, [targetPetId]: false }))
    }
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
          if (response.status === 400 && errorText.includes("Like does not exist")) {
            setLikedPosts((prev) => {
              const newSet = new Set(prev)
              newSet.delete(postId)
              return newSet
            })
          }
        }
      } else {
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
          if (response.status === 400 && errorText.includes("Like already exists")) {
            setLikedPosts((prev) => new Set(prev).add(postId))
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

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const handlePetClick = (petId: string) => {
    window.location.href = `/public-pet/${petId}`
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("selectedPetId")
    window.location.href = "/login"
  }

  const handleNavigation = (path: string) => {
    window.location.href = path
  }

  const handleCloseProfile = () => {
    window.location.href = "/pets"
  }

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
    setEditPostModal({ isOpen: false, post: null })
  }

  const confirmDeletePost = async (postId: string) => {
    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/delete/${postId}`,
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== postId))
      } else {
        console.error("Error deleting post:", response.status, await response.text())
      }
    } catch (error) {
      console.error("Error deleting post:", error)
    } finally {
      setDeletePostModal({ isOpen: false, postId: null })
    }
  }

  const confirmDeletePet = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/delete/${petId}`,
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        window.location.href = "/home"
      } else {
        console.error("Error deleting pet profile:", response.status, await response.text())
      }
    } catch (error) {
      console.error("Error deleting pet profile:", error)
    } finally {
      setDeletePetModal(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev])
    setCreatePostModal(false)
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Removed the back button as requested */}
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

            <DropdownMenu open={showUserDropdown} onOpenChange={setShowUserDropdown}>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#30363d] hover:border-[#58a6ff] transition-colors">
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[#161b22] border-[#30363d] text-white">
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={userInfo?.avatar || "/placeholder.svg?height=40&width=40"}
                      alt="User avatar"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{userInfo?.name}</p>
                      <p className="text-xs text-[#8b949e] truncate">{userInfo?.email}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-[#30363d]" />
                <DropdownMenuItem
                  onClick={() => handleNavigation("/settings")}
                  className="hover:bg-[#21262d] cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Your profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation("/notifications")}
                  className="hover:bg-[#21262d] cursor-pointer"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation("/settings")}
                  className="hover:bg-[#21262d] cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#30363d]" />
                <DropdownMenuItem onClick={handleCloseProfile} className="hover:bg-[#21262d] cursor-pointer">
                  <X className="h-4 w-4 mr-2" />
                  Close this profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#30363d]" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#f85149] hover:bg-[#da3633] hover:bg-opacity-15 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          <div className="lg:col-span-1 space-y-6">
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

                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-6">
                  <button
                    onClick={() => setFollowersModal(true)}
                    className="w-full flex items-center justify-center gap-3 hover:bg-[#30363d] rounded-lg p-2 transition-colors"
                  >
                    <Users className="h-5 w-5 text-[#58a6ff]" />
                    <div className="text-center">
                      <span className="text-lg font-bold text-white">{followersData?.followers_count || 0}</span>
                      <span className="text-sm text-[#8b949e] ml-2">Followers</span>
                    </div>
                  </button>
                </div>

                {!isOwnPet && (
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
                )}

                {isOwnPet && (
                  <div className="text-center p-4 bg-[#21262d] rounded-lg border border-[#30363d]">
                    <PawPrint className="h-6 w-6 text-[#58a6ff] mx-auto mb-2" />
                    <p className="text-[#8b949e] text-sm">This is your pet's profile</p>
                  </div>
                )}
              </CardContent>
            </Card>

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

                    <div className="space-y-3 mb-4">
                      <p className="text-white leading-relaxed whitespace-pre-wrap">{post.content}</p>

                     {post.image && (
  <div className="rounded-lg overflow-hidden border border-[#30363d] mt-3 bg-[#0d1117]">
    <img
      src={post.image}
      alt="Post image"
      className="w-full h-auto min-h-[200px] max-h-[600px] object-contain"
      style={{ aspectRatio: 'auto' }}
      onError={(e) => {
        const target = e.target as HTMLImageElement
        target.src = "/placeholder.svg?height=300&width=400"
      }}
    />
  </div>
)}
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-[#30363d]">
                      <button
                        onClick={() => post.petId && handleLike(post.id, post.petId)}
                        disabled={selectedPetId === post.petId}
                        className={`flex items-center gap-2 transition-colors ${
                          likedPosts.has(post.id) ? "text-[#f85149]" : "text-[#8b949e] hover:text-[#f85149]"
                        } ${selectedPetId === post.petId ? "opacity-50 cursor-not-allowed" : ""}`}
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

      {followersModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#58a6ff]" />
                <h2 className="text-lg font-semibold text-white">
                  {pet.name}'s Followers ({followersData?.followers_count || 0})
                </h2>
              </div>
              <button
                onClick={() => setFollowersModalOpen(false)}
                className="text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {!followersData || followersData.followers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-[#30363d] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">No followers yet</h3>
                  <p className="text-[#8b949e] text-sm">When people start following {pet.name}, they'll appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {followersWithImages.map((follower) => (
                    <div key={follower.id} className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={follower.image || "/placeholder.svg"}
                          alt={follower.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#30363d]"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                        <div className="flex-1">
                          <button
                            onClick={() => handlePetClick(follower.id)}
                            className="text-white font-medium hover:text-[#58a6ff] transition-colors text-left"
                          >
                            {follower.name}
                          </button>
                        </div>
                      </div>

                      {!follower.isOwnPet && (
                        <Button
                          onClick={() => handleIndividualFollowToggle(follower.id)}
                          disabled={followLoadingStates[follower.id]}
                          size="sm"
                          className={`ml-3 ${
                            followingStates[follower.id]
                              ? "bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
                              : "bg-[#238636] hover:bg-[#2ea043] text-white"
                          }`}
                        >
                          {followLoadingStates[follower.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : followingStates[follower.id] ? (
                            <UserMinus className="h-3 w-3" />
                          ) : (
                            <UserPlus className="h-3 w-3" />
                          )}
                          <span className="ml-1 text-xs">{followingStates[follower.id] ? "Unfollow" : "Follow"}</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
