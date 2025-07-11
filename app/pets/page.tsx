"use client"

import { useEffect, useState } from "react"
import { Loader2, MoreHorizontal, Eye, Edit, Trash2, Users, MapPin, PawPrint, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { Header } from "@/components/header"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { PhoneDisplay } from "@/components/phone-display"
import { FollowersModal } from "@/components/followers-modal"
import { EditPetModal } from "@/components/edit-pet-modal"

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
  followersCount?: number
}

export default function MyPetsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<Responsible | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loadingPets, setLoadingPets] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; pet: Pet | null }>({
    isOpen: false,
    pet: null,
  })
  const [followersModal, setFollowersModal] = useState<{ isOpen: boolean; pet: Pet | null }>({
    isOpen: false,
    pet: null,
  })
  const [editModal, setEditModal] = useState<{ isOpen: boolean; pet: Pet | null }>({
    isOpen: false,
    pet: null,
  })

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("authToken")
    if (!authToken) {
      window.location.href = "/login"
      return
    }

    loadUserInfo()
    loadUserPets()
  }, [])

  const loadUserInfo = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/getId`)

      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.responsible)
      } else {
        console.error("Error loading user info")
        localStorage.removeItem("authToken")
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Error loading user info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserPets = async () => {
    try {
      setLoadingPets(true)

      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/getAll`)

      if (response.ok) {
        const data = await response.json()

        if (Array.isArray(data)) {
          // Load followers count for each pet
          const petsWithFollowers = await Promise.all(
            data.map(async (pet) => {
              try {
                const followersResponse = await makeAuthenticatedRequest(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/${pet.id}/followers/count`,
                )
                if (followersResponse.ok) {
                  const followersData = await followersResponse.json()
                  return { ...pet, followersCount: followersData.count || 0 }
                }
              } catch (error) {
                console.error(`Error loading followers for pet ${pet.id}:`, error)
              }
              return { ...pet, followersCount: 0 }
            }),
          )
          setPets(petsWithFollowers)
        } else {
          setPets([])
        }
      } else {
        console.error("Error loading pets, status:", response.status)

        if (response.status === 401) {
          localStorage.removeItem("authToken")
          window.location.href = "/login"
          return
        }

        setPets([])
      }
    } catch (error) {
      console.error("Network error loading pets:", error)
      setPets([])
    } finally {
      setLoadingPets(false)
    }
  }

  const handleViewPet = (petId: string) => {
    window.location.href = `/pet/${petId}`
  }

  const handleEditPet = (pet: Pet) => {
    setEditModal({ isOpen: true, pet })
  }

  const handleDeletePet = (pet: Pet) => {
    setDeleteModal({ isOpen: true, pet })
  }

  const handleFollowersClick = (pet: Pet) => {
    setFollowersModal({ isOpen: true, pet })
  }

  const confirmDeletePet = async () => {
    if (!deleteModal.pet) return

    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/delete/${deleteModal.pet.id}`,
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        setPets(pets.filter((pet) => pet.id !== deleteModal.pet!.id))
        setDeleteModal({ isOpen: false, pet: null })

        // Show success message briefly
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = `${deleteModal.pet.name}'s profile has been deleted successfully!`
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 3000)
      } else {
        const errorData = await response.json()
        alert(`Error deleting profile: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error deleting pet:", error)
      alert("Network error. Please check your connection and try again.")
    }
  }

  const handlePetUpdated = (updatedPet: Pet) => {
    setPets(pets.map((pet) => (pet.id === updatedPet.id ? { ...pet, ...updatedPet } : pet)))
    setEditModal({ isOpen: false, pet: null })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }
  const handlePetCardClick = (petId: string) => {
  localStorage.setItem("selectedPetId", petId)
  window.location.href = "/home"
}


  return (
    
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <Header userInfo={userInfo} currentPage="pets" />
            <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-white mb-4">Which pet profile would you like to visit? 🐾</h1>
        <p className="text-[#8b949e] text-lg">Choose one of your adorable companions to continue</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
          {/* Sidebar izquierdo - Información del usuario */}
          <div className="lg:col-span-1">
            <h1 className="text-2xl font-semibold text-white mb-6">My Pets</h1>

            <div className="w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#30363d] bg-[#21262d]">
              <img
                src={userInfo?.avatar || "/placeholder.svg?height=256&width=256"}
                alt="User image"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=256&width=256"
                }}
              />
            </div>

            <div className="text-center space-y-2 mb-8">
              <h2 className="text-xl font-semibold text-white">{userInfo?.name}</h2>
              <p className="text-[#8b949e]">{userInfo?.email}</p>
              {userInfo?.contact && (
                <div className="flex justify-center">
                  <PhoneDisplay phoneNumber={userInfo.contact} />
                </div>
              )}
            </div>

            {/* Botón Add another pet en el sidebar */}
            <div
              className="bg-[#161b22] border-2 border-dashed border-[#30363d] rounded-lg p-6 text-center hover:border-[#58a6ff] transition-colors cursor-pointer"
              onClick={() => (window.location.href = "/create-pet")}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#21262d] flex items-center justify-center">
                <PawPrint className="h-6 w-6 text-[#58a6ff]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Add another pet</h3>
              <p className="text-[#8b949e] text-sm mb-4">Ready to add another furry friend?</p>
              <Button className="bg-[#238636] hover:bg-[#2ea043] text-white">Create new pet profile</Button>
            </div>
          </div>

          {/* Área principal derecha - Grid de tarjetas de mascotas */}
          <div className="lg:col-span-2">
            {loadingPets ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-[#8b949e]">Loading your pets...</span>
              </div>
            ) : pets.length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#21262d] flex items-center justify-center">
                  <PawPrint className="h-12 w-12 text-[#30363d]" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">No pets yet</h3>
                <p className="text-[#8b949e] mb-8 text-lg">Create your first pet profile to get started!</p>
                <Button
                  onClick={() => (window.location.href = "/create-pet")}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-3 text-lg"
                >
                  Create your first pet
                </Button>
              </div>
            ) : (
              /* Grid 2x2 de tarjetas de mascotas */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    onClick={() => handlePetCardClick(pet.id)}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#58a6ff] transition-all duration-200 hover:shadow-lg hover:shadow-[#58a6ff]/10 cursor-pointer"
                  >
                    {/* Header con nombre y menú */}
                    <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
                      <span className="text-[#58a6ff] font-semibold text-lg">{pet.name}</span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-full"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#161b22] border-[#30363d] text-white">
                          <DropdownMenuItem
                            onClick={() => handleViewPet(pet.id)}
                            className="hover:bg-[#21262d] cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View pet profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditPet(pet)}
                            className="hover:bg-[#21262d] cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit pet profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#30363d]" />
                          <DropdownMenuItem
                            onClick={() => handleDeletePet(pet)}
                            className="text-[#f85149] hover:bg-[#da3633] hover:bg-opacity-15 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete pet profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Contenido principal */}
                    <div className="p-6">
                      {/* Imagen grande centrada */}
                      <div className="flex justify-center mb-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#30363d] bg-[#21262d]">
                          <img
                            src={pet.image || "/placeholder.svg?height=128&width=128"}
                            alt={`Image of ${pet.name}`}
                            className="w-full h-full object-cover object-center"
                            style={{
                              objectFit: "cover",
                              objectPosition: "center",
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=128&width=128"
                            }}
                          />
                        </div>
                      </div>

                      {/* Información esencial */}
                      <div className="space-y-3">
                        {/* Residencia */}
                        <div className="flex items-center gap-3 text-[#8b949e]">
                          <MapPin className="h-4 w-4 text-[#58a6ff] flex-shrink-0" />
                          <span className="text-sm">{pet.residence || "Location not specified"}</span>
                        </div>

                        {/* Followers */}
                        <div className="relative">
                          <button
                            className="flex items-center gap-3 text-[#8b949e] hover:text-[#58a6ff] transition-colors w-full"
                            onClick={() => handleFollowersClick(pet)}
                          >
                            <Users className="h-4 w-4 text-[#58a6ff] flex-shrink-0" />
                            <span className="text-sm">
                              {(pet.followersCount || 0).toLocaleString()} follower
                              {(pet.followersCount || 0) !== 1 ? "s" : ""}
                            </span>
                          </button>
                        </div>

                        {/* Fecha de nacimiento */}
                        <div className="flex items-center gap-3 text-[#8b949e]">
                          <Calendar className="h-4 w-4 text-[#58a6ff] flex-shrink-0" />
                          <span className="text-sm">
                            Born{" "}
                            {new Date(pet.birthdate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Pet Profile"
        message={`Are you sure you want to delete ${deleteModal.pet?.name}'s profile? This action cannot be undone and all data will be permanently lost.`}
        confirmText="Delete Profile"
        onConfirm={confirmDeletePet}
        onCancel={() => setDeleteModal({ isOpen: false, pet: null })}
      />

      {/* Followers Modal */}
      {followersModal.pet && (
        <FollowersModal
          isOpen={followersModal.isOpen}
          petName={followersModal.pet.name}
          petId={followersModal.pet.id}
          onClose={() => setFollowersModal({ isOpen: false, pet: null })}
        />
      )}

      {/* Edit Pet Modal */}
      {editModal.pet && (
        <EditPetModal
          isOpen={editModal.isOpen}
          pet={editModal.pet}
          onClose={() => setEditModal({ isOpen: false, pet: null })}
          onSuccess={handlePetUpdated}
        />
      )}
    </div>
  )
}
