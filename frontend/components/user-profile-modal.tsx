"use client"

import { useState, useEffect } from "react"
import { X, User, Mail, Phone, Calendar, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { makeAuthenticatedRequest } from "@/utils/auth"

interface UserInfo {
  id: string
  name: string
  email: string
  contact: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadUserInfo()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const loadUserInfo = async () => {
    try {
      setIsLoading(true)
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

  const handleSettings = () => {
    onClose()
    window.location.href = "/settings"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
          <h2 className="text-xl font-semibold text-white">Your Profile</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-[#8b949e]">Loading profile...</div>
            </div>
          ) : userInfo ? (
            <div className="space-y-6">
              {/* Avatar and Name */}
              <div className="text-center">
                <img
                  src={userInfo.avatar || "/placeholder.svg?height=80&width=80"}
                  alt={userInfo.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#30363d] mx-auto mb-3"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=80&width=80"
                  }}
                />
                <h3 className="text-xl font-semibold text-white">{userInfo.name}</h3>
                <p className="text-[#8b949e] text-sm">{userInfo.email}</p>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                  <User className="h-5 w-5 text-[#58a6ff]" />
                  <div>
                    <p className="text-[#8b949e] text-sm">Name</p>
                    <p className="text-white font-medium">{userInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                  <Mail className="h-5 w-5 text-[#58a6ff]" />
                  <div>
                    <p className="text-[#8b949e] text-sm">Email</p>
                    <p className="text-white font-medium">{userInfo.email}</p>
                  </div>
                </div>

                {userInfo.contact && (
                  <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                    <Phone className="h-5 w-5 text-[#58a6ff]" />
                    <div>
                      <p className="text-[#8b949e] text-sm">Contact</p>
                      <p className="text-white font-medium">{userInfo.contact}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                  <Calendar className="h-5 w-5 text-[#58a6ff]" />
                  <div>
                    <p className="text-[#8b949e] text-sm">Member since</p>
                    <p className="text-white font-medium">
                      {new Date(userInfo.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleSettings} className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#f85149]">Failed to load profile information</p>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0" onClick={onClose} />
    </div>
  )
}
