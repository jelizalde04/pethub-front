"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, MapPin, Calendar, Users, PawPrint, Edit, Award, Trash2, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { Header } from "@/components/header"
import { PostCard } from "@/components/post-card"
import { EditPostModal } from "@/components/edit-post-modal"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { PhoneDisplay } from "@/components/phone-display"
import { FollowersModal } from "@/components/followers-modal"
import { CreatePostModal } from "@/components/create-post-modal"
import { CreatePostBox } from "@/components/create-post-box"
import { EditPetModal } from "@/components/edit-pet-modal"
import { MedicalRecordSection } from "@/components/medical-record-section"
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

interface PetData {
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
  image: string
  likes: number
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data: PetData
}

export default function PetProfilePage() {
  const params = useParams()
  const petId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [pet, setPet] = useState<PetData | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<Responsible | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  // Hook de búsqueda
  const { filteredData: filteredPosts, totalResults } = useSearch({
    data: posts,
    searchFields: ['content'],
    searchQuery
  })

  // Modal states
  const [editPostModal, setEditPostModal] = useState<{ isOpen: boolean; post: Post | null }>({
    isOpen: false,
    post: null,
  })
  const [deletePostModal, setDeletePostModal] = useState<{ isOpen: boolean; postId: string | null }>({
    isOpen: false,
    postId: null,
  })
  const [deletePetModal, setDeletePetModal] = useState(false)
  const [followersModal, setFollowersModal] = useState(false)
  const [createPostModal, setCreatePostModal] = useState(false)
  const [editPetModal, setEditPetModal] = useState(false)

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    if (!authToken) {
      window.location.href = "/login"
      return
    }

    if (petId) {
      loadUserInfo()
      loadPetData()
      loadPetPosts()
      loadFollowersCount()
    }
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

  const loadPetData = async () => {
    try {
      setIsLoading(true)
      console.log("Loading pet data for ID:", petId)

      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/getId/${petId}`)

      if (response.ok) {
        const result: ApiResponse = await response.json()
        console.log("Pet data received:", result)

        if (result.success && result.data) {
          setPet(result.data)

          if (!result.data.responsible.contact && result.data.responsibleId) {
            try {
              const responsibleResponse = await makeAuthenticatedRequest(
                `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/getId`,
              )
              if (responsibleResponse.ok) {
                const responsibleData = await responsibleResponse.json()
                if (responsibleData.responsible && responsibleData.responsible.id === result.data.responsibleId) {
                  setPet({
                    ...result.data,
                    responsible: {
                      ...result.data.responsible,
                      contact: responsibleData.responsible.contact,
                    },
                  })
                }
              }
            } catch (error) {
              console.error("Error loading responsible contact:", error)
            }
          }
        } else {
          setError("Pet data not found")
        }
      } else {
        if (response.status === 404) {
          setError("Pet not found")
        } else if (response.status === 401) {
          localStorage.removeItem("authToken")
          window.location.href = "/login"
          return
        } else {
          setError("Error loading pet data")
        }
      }
    } catch (error) {
      console.error("Error loading pet:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadPetPosts = async () => {
    try {
      setLoadingPosts(true)
      console.log("Loading posts for pet ID:", petId)

      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/pet/${petId}`)

      if (response.ok) {
        const postsData = await response.json()
        console.log("Posts data received:", postsData)

        const postsWithPetId = Array.isArray(postsData)
          ? postsData.map((post) => ({
              ...post,
              petId: petId,
            }))
          : []

        const sortedPosts = postsWithPetId.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        setPosts(sortedPosts)
      } else {
        console.error("Error loading posts, status:", response.status)
        setPosts([])
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      setPosts([])
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadFollowersCount = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_TRES}/api/v1/followers?petId=${petId}`,
        {
          method: "GET",
        },
      )
      if (response.ok) {
        const data = await response.json()
        setFollowersCount(data.followers_count || 0)
      }
    } catch (error) {
      console.error("Error loading followers count:", error)
      setFollowersCount(0)
    }
  }

  useEffect(() => {
    if (userInfo && pet) {
      setIsOwner(userInfo.id === pet.responsibleId)
    }
  }, [userInfo, pet])

  const handleEdit = () => {
    setEditPetModal(true)
  }

  const handleBack = () => {
    window.location.href = "/pets"
  }

  const handleEditPost = (post: Post) => {
    setEditPostModal({ isOpen: true, post })
  }

  const handleDeletePost = (postId: string) => {
    setDeletePostModal({ isOpen: true, postId })
  }

  const handleDeletePet = () => {
    setDeletePetModal(true)
  }

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts])
  }

  const handlePetUpdated = (updatedPet: PetData) => {
    setPet(updatedPet)
    setEditPetModal(false)
  }

  const confirmDeletePost = async () => {
    if (!deletePostModal.postId) return

    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/posts/delete/${deletePostModal.postId}`,
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== deletePostModal.postId))
        setDeletePostModal({ isOpen: false, postId: null })

        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Post deleted successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error deleting post: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Network error. Please check your connection and try again.")
    }
  }

  const confirmDeletePet = async () => {
    if (!pet) return

    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/delete/${pet.id}`,
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = `${pet.name}'s profile has been deleted successfully!`
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
          window.location.href = "/pets"
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error deleting profile: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error deleting pet:", error)
      alert("Network error. Please check your connection and try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header 
          userInfo={userInfo}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    )
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header 
          userInfo={userInfo}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <PawPrint className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Pet not found</h1>
            <p className="text-[#8b949e] mb-6">{error || "The pet you're looking for doesn't exist."}</p>
            {/* Removed the "Back to My Pets" button as requested */}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header 
        userInfo={userInfo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="relative bg-gradient-to-r from-[#161b22] to-[#21262d] border-b border-[#30363d]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            {/* This is the button that was removed */}
            {/* <button onClick={handleBack} className="text-[#8b949e] hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button> */}
            <div className="flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-[#58a6ff]" />
              <span className="text-[#8b949e] text-sm">Pet Profile</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-1">
              <div className="w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-[#21262d] border-2 border-[#30363d]">
                <img
                  src={pet.image || "/placeholder.svg?height=350&width=350"}
                  alt={`${pet.name}'s photo`}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=350&width=350"
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{pet.name}</h1>
                  <div className="flex items-center gap-4 text-[#8b949e] mb-4">
                    <span className="text-lg capitalize">{pet.gender}</span>
                    <span className="w-1 h-1 bg-[#8b949e] rounded-full"></span>
                    <span className="text-lg">{pet.breed}</span>
                  </div>
                  {pet.color && (
                    <div className="inline-flex items-center gap-2 bg-[#21262d] px-3 py-1 rounded-full border border-[#30363d] mb-4">
                      <Palette className="w-3 h-3 text-[#58a6ff]" />
                      <span className="text-sm text-[#8b949e]">{pet.color}</span>
                    </div>
                  )}
                </div>

                {isOwner && (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleEdit}
                      className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button onClick={handleDeletePet} className="bg-[#da3633] hover:bg-[#f85149] text-white">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Pet
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-6">
                <button
                  onClick={() => setFollowersModal(true)}
                  className="w-full flex items-center justify-center gap-3 hover:bg-[#30363d] rounded-lg p-2 transition-colors"
                >
                  <Users className="h-5 w-5 text-[#58a6ff]" />
                  <div className="text-center">
                    <span className="text-lg font-bold text-white">{followersCount}</span>
                    <span className="text-sm text-[#8b949e] ml-2">Followers</span>
                  </div>
                </button>
              </div>

              {!isOwner && (
                <div className="flex gap-3">
                  <Button className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Posts</h2>
                {searchQuery && (
                  <span className="text-sm text-[#8b949e]">
                    {totalResults} results for "{searchQuery}"
                  </span>
                )}
              </div>

              {isOwner && (
                <CreatePostBox petName={pet.name} petImage={pet.image} onClick={() => setCreatePostModal(true)} />
              )}

              {loadingPosts ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                  <p className="text-[#8b949e]">Loading posts...</p>
                </div>
              ) : filteredPosts.length === 0 && !searchQuery ? (
                <div className="text-center py-8">
                  <PawPrint className="h-12 w-12 text-[#30363d] mx-auto mb-3" />
                  <p className="text-[#8b949e]">No posts yet</p>
                  <p className="text-[#6e7681] text-sm">
                    {isOwner
                      ? "Share your first moment with " + pet.name + "!"
                      : "This pet hasn't shared anything yet."}
                  </p>
                </div>
              ) : searchQuery && filteredPosts.length === 0 ? (
                <div className="text-center py-8">
                  <PawPrint className="h-12 w-12 text-[#30363d] mx-auto mb-3" />
                  <p className="text-[#8b949e]">No posts found</p>
                  <p className="text-[#6e7681] text-sm">
                    No posts found for "{searchQuery}". Try a different search term.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      petName={pet.name}
                      petImage={pet.image}
                      onEdit={() => handleEditPost(post)}
                      onDelete={isOwner ? handleDeletePost : undefined}
                      disableLike={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Owner</h3>
              <div className="space-y-4">
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
                  <div className="flex-1">
                    <p className="text-white font-medium">{pet.responsible.name}</p>
                    <p className="text-[#8b949e] text-sm">{pet.responsible.email}</p>
                  </div>
                </div>

                {pet.responsible.contact && (
                  <div className="pt-2 border-t border-[#30363d]">
                    <p className="text-sm text-[#8b949e] mb-2">Contact</p>
                    <PhoneDisplay phoneNumber={pet.responsible.contact} />
                  </div>
                )}
              </div>
            </div>

            <MedicalRecordSection petId={pet.id} isOwner={isOwner} />
          </div>
        </div>
      </div>

      <EditPostModal
        post={editPostModal.post}
        isOpen={editPostModal.isOpen}
        onClose={() => setEditPostModal({ isOpen: false, post: null })}
        onSuccess={handlePostUpdated}
      />

      <DeleteConfirmationModal
        isOpen={deletePostModal.isOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone and all data will be permanently lost."
        confirmText="Delete Post"
        onConfirm={confirmDeletePost}
        onCancel={() => setDeletePostModal({ isOpen: false, postId: null })}
      />

      <DeleteConfirmationModal
        isOpen={deletePetModal}
        title="Delete Pet Profile"
        message={`Are you sure you want to delete ${pet.name}'s profile? This action cannot be undone and all data will be permanently lost.`}
        confirmText="Delete Profile"
        onConfirm={confirmDeletePet}
        onCancel={() => setDeletePetModal(false)}
      />

      <FollowersModal
        isOpen={followersModal}
        petName={pet.name}
        petId={pet.id}
        onClose={() => setFollowersModal(false)}
      />

      <CreatePostModal
        isOpen={createPostModal}
        petId={pet.id}
        petName={pet.name}
        petImage={pet.image}
        onClose={() => setCreatePostModal(false)}
        onSuccess={handlePostCreated}
      />

      {pet && (
        <EditPetModal
          isOpen={editPetModal}
          pet={{
            ...pet,
            responsible: pet.responsible,
            followersCount: followersCount,
          }}
          onClose={() => setEditPetModal(false)}
          onSuccess={handlePetUpdated}
        />
      )}
    </div>
  )
}