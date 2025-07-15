"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { Loader2, Users, UserPlus, UserMinus } from "lucide-react"
import Link from "next/link"

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

interface PetInfo {
  id: string
  name: string
  image: string
}

interface FollowerWithImage extends Follower {
  image: string
  isOwnPet: boolean // Para saber si es nuestra propia mascota
}

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  petName: string
  petId: string
}

export function FollowersModal({ isOpen, onClose, petName, petId }: FollowersModalProps) {
  const [followersData, setFollowersData] = useState<FollowersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [allPets, setAllPets] = useState<PetInfo[]>([])
  const [followersWithImages, setFollowersWithImages] = useState<FollowerWithImage[]>([])
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({}) // Estado de seguimiento individual
  const [followLoadingStates, setFollowLoadingStates] = useState<Record<string, boolean>>({}) // Estado de carga individual

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      loadFollowersData()
      loadAllPets() // Cargar todas las mascotas para obtener sus imágenes
    }
  }, [isOpen, petId])

  const loadFollowersData = async () => {
    try {
      // Usando GET con query parameters para el endpoint de seguidores
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_TRES}/api/v1/followers?petId=${petId}`,
        {
          method: "GET",
        },
      )
      if (response.ok) {
        const data = await response.json()
        console.log("Followers Data from API:", data) // Debugging
        setFollowersData(data)
      } else {
        console.error("Error loading followers data, status:", response.status)
        setFollowersData({ petId, followers_count: 0, followers: [] })
      }
    } catch (error) {
      console.error("Error loading followers data:", error)
      setFollowersData({ petId, followers_count: 0, followers: [] })
    } finally {
      setLoading(false)
    }
  }

  const loadAllPets = async () => {
    try {
      // Este endpoint no requiere autenticación, se usa fetch directamente
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/all`, {
        method: "GET",
      })
      if (response.ok) {
        const data = await response.json()
        console.log("All Pets Data from API:", data) // Debugging
        setAllPets(data.pets || []) // Asegúrate de que 'data.pets' es el array correcto
      } else {
        console.error("Error loading all pets, status:", response.status)
        setAllPets([])
      }
    } catch (error) {
      console.error("Error loading all pets:", error)
      setAllPets([])
    }
  }

  // Función para verificar si estamos siguiendo a cada mascota individual
  const checkFollowingStates = async (followerIds: string[]) => {
    const selectedPetId = localStorage.getItem("selectedPetId")
    if (!selectedPetId) return

    const states: Record<string, boolean> = {}
    for (const targetPetId of followerIds) {
      try {
        // Este endpoint de verificación de seguimiento también es GET con query parameters
        const response = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_TRES}/api/v1/followers?petId=${targetPetId}`,
          {
            method: "GET",
          },
        )
        if (response.ok) {
          const data = await response.json()
          // Verificar si nuestra mascota está en la lista de seguidores de targetPetId
          const isFollowing = data.followers?.some((follower: any) => follower.id === selectedPetId) || false
          states[targetPetId] = isFollowing
        } else {
          states[targetPetId] = false
        }
      } catch (error) {
        console.error(`Error checking follow state for ${targetPetId}:`, error)
        states[targetPetId] = false
      }
    }
    setFollowingStates(states)
  }

  // Función para combinar followers con sus imágenes y verificar estados de seguimiento
  useEffect(() => {
    console.log("useEffect: followersData changed", followersData) // Debugging
    console.log("useEffect: allPets changed", allPets) // Debugging

    if (followersData && allPets.length > 0) {
      const selectedPetId = localStorage.getItem("selectedPetId")
      const followersWithImagesData = followersData.followers.map((follower) => {
        const petData = allPets.find((pet) => pet.id === follower.id)
        console.log(`Finding pet for follower ${follower.id}:`, petData) // Debugging
        const isOwnPetFollower = follower.id === selectedPetId // Si el follower es nuestra propia mascota
        return {
          id: follower.id,
          name: follower.name,
          image: petData?.image || "/placeholder.svg?height=40&width=40", // Usar imagen real o placeholder
          created_at: follower.created_at,
          isOwnPet: isOwnPetFollower,
        }
      })
      setFollowersWithImages(followersWithImagesData)

      // Verificar estados de seguimiento para cada follower (excepto nuestra propia mascota)
      const followerIdsToCheck = followersWithImagesData.filter((f) => !f.isOwnPet).map((f) => f.id)
      if (followerIdsToCheck.length > 0) {
        checkFollowingStates(followerIdsToCheck)
      }
    } else if (followersData && allPets.length === 0 && !loading) {
      // Si no hay mascotas cargadas (o allPets está vacío) pero ya terminamos de cargar,
      // mostrar solo nombres con placeholder. Esto cubre el caso donde allPets falla.
      const followersWithoutImages = followersData.followers.map((follower) => ({
        id: follower.id,
        name: follower.name,
        image: "/placeholder.svg?height=40&width=40", // Usar placeholder si no hay imágenes de mascotas
        created_at: follower.created_at,
        isOwnPet: follower.id === localStorage.getItem("selectedPetId"),
      }))
      setFollowersWithImages(followersWithoutImages)
    }
  }, [followersData, allPets, loading])

  // Función para manejar follow/unfollow individual de cada mascota en la lista
  const handleIndividualFollowToggle = async (targetPetId: string, isCurrentlyFollowing: boolean) => {
    const selectedPetId = localStorage.getItem("selectedPetId")
    if (!selectedPetId || followLoadingStates[targetPetId]) return

    setFollowLoadingStates((prev) => ({ ...prev, [targetPetId]: true }))

    try {
      let response
      if (isCurrentlyFollowing) {
        // Unfollow
        response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_DOS}/api/v1/followers`, {
          method: "DELETE",
          body: JSON.stringify({
            followerId: selectedPetId,
            petId: targetPetId,
          }),
        })
      } else {
        // Follow
        response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_FOLLOWERS_API_URL_UNO}/api/v1/followers`, {
          method: "POST",
          body: JSON.stringify({
            followerId: selectedPetId,
            petId: targetPetId,
          }),
        })
      }

      if (response.ok) {
        setFollowingStates((prev) => ({ ...prev, [targetPetId]: !isCurrentlyFollowing }))
        // Opcional: Recargar el conteo de seguidores si es necesario
        // loadFollowersData();
      } else {
        console.error("Error toggling individual follow, status:", response.status)
      }
    } catch (error) {
      console.error("Error toggling individual follow:", error)
    } finally {
      setFollowLoadingStates((prev) => ({ ...prev, [targetPetId]: false }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#161b22] text-white border border-[#30363d]">
        <DialogHeader className="border-b border-[#30363d] pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#58a6ff]" />
            {petName}'s Followers ({followersData?.followers_count || 0})
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-[#58a6ff]" />
            </div>
          ) : followersWithImages.length === 0 ? (
            <div className="text-center text-[#8b949e] py-8">
              <p>No followers yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {followersWithImages.map((follower) => {
                const isCurrentlyFollowing = followingStates[follower.id] || false
                const isLoadingIndividual = followLoadingStates[follower.id] || false
                const selectedPetId = localStorage.getItem("selectedPetId")
                const isOwnPet = follower.id === selectedPetId // Si el follower es la mascota actualmente seleccionada

                return (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between gap-4 bg-[#21262d] p-3 rounded-lg border border-[#30363d]"
                  >
                    <Link
                      href={`/public-pet/${follower.id}`}
                      className="flex items-center gap-3 flex-grow hover:text-[#58a6ff] transition-colors"
                    >
                      <img
                        src={follower.image || "/placeholder.svg?height=40&width=40"}
                        alt={follower.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#30363d]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=40&width=40"
                        }}
                      />
                      <span className="font-medium text-white">{follower.name}</span>
                    </Link>
                    {!isOwnPet &&
                      selectedPetId && ( // Mostrar botón solo si no es nuestra propia mascota y hay una mascota seleccionada
                        <Button
                          onClick={() => handleIndividualFollowToggle(follower.id, isCurrentlyFollowing)}
                          disabled={isLoadingIndividual}
                          className={`h-8 px-3 text-sm ${
                            isCurrentlyFollowing
                              ? "bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
                              : "bg-[#238636] hover:bg-[#2ea043] text-white"
                          }`}
                        >
                          {isLoadingIndividual ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isCurrentlyFollowing ? (
                            <UserMinus className="h-4 w-4 mr-1" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-1" />
                          )}
                          {isLoadingIndividual ? "" : isCurrentlyFollowing ? "Unfollow" : "Follow"}
                        </Button>
                      )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
