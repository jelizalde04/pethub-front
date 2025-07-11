"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, User, Mail, Phone, Camera, Edit, Trash2, Save, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { Header } from "@/components/header"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"

interface UserInfo {
  id: string
  name: string
  email: string
  password: string
  contact: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteAccountModal, setDeleteAccountModal] = useState(false)
  const [deleteAvatarModal, setDeleteAvatarModal] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
  })

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      setIsLoading(true)
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/getId`)

      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.responsible)
        setFormData({
          name: data.responsible.name,
          email: data.responsible.email,
          password: data.responsible.password,
          contact: data.responsible.contact || "",
        })
      }
    } catch (error) {
      console.error("Error loading user info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/update`, {
        method: "PUT",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.responsible)
        setIsEditing(false)

        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Profile updated successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error updating profile: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Network error. Please check your connection and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/delete`, {
        method: "DELETE",
      })

      if (response.ok) {
        localStorage.removeItem("authToken")

        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Account deleted successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
          window.location.href = "/login"
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error deleting account: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Network error. Please check your connection and try again.")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, action: "upload" | "edit") => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the file
    if (action === "upload") {
      handleAvatarUpload(file)
    } else {
      handleAvatarEdit(file)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/avatars/upload`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        loadUserInfo() // Reload user info to get new avatar

        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Avatar uploaded successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error uploading avatar: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Network error. Please check your connection and try again.")
    }

    setAvatarMenuOpen(false)
    setAvatarPreview(null)
  }

  const handleAvatarEdit = async (file: File) => {
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/avatars/update`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        loadUserInfo() // Reload user info to get updated avatar

        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Avatar updated successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error updating avatar: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error updating avatar:", error)
      alert("Network error. Please check your connection and try again.")
    }

    setAvatarMenuOpen(false)
    setAvatarPreview(null)
  }

  const handleAvatarDelete = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/avatars/delete`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadUserInfo() // Reload user info to remove avatar

        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Avatar deleted successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error deleting avatar: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error deleting avatar:", error)
      alert("Network error. Please check your connection and try again.")
    }

    setDeleteAvatarModal(false)
    setAvatarMenuOpen(false)
  }

  const handleBack = () => {
    window.location.href = "/home"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-[#8b949e]">Loading settings...</div>
        </div>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-[#f85149]">Failed to load user information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleBack} className="text-[#8b949e] hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-[#8b949e]">Manage your account settings and preferences</p>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          {/* Avatar Section */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <img
                src={avatarPreview || userInfo.avatar || "/placeholder.svg?height=120&width=120"}
                alt={userInfo.name}
                className="w-30 h-30 rounded-full object-cover border-4 border-[#30363d]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=120&width=120"
                }}
              />
              <DropdownMenu open={avatarMenuOpen} onOpenChange={setAvatarMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="absolute top-2 right-2 p-2 bg-[#21262d] hover:bg-[#30363d] rounded-full border border-[#30363d] transition-colors">
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#161b22] border-[#30363d] text-white">
                  <DropdownMenuItem asChild className="hover:bg-[#21262d] cursor-pointer">
                    <label>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, "upload")}
                        className="hidden"
                      />
                    </label>
                  </DropdownMenuItem>
                  {userInfo.avatar && (
                    <>
                      <DropdownMenuItem asChild className="hover:bg-[#21262d] cursor-pointer">
                        <label>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Avatar
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, "edit")}
                            className="hidden"
                          />
                        </label>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteAvatarModal(true)}
                        className="text-[#f85149] hover:bg-[#da3633] hover:bg-opacity-15 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Avatar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-[#58a6ff]" />
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#0d1117] border-[#30363d] text-white disabled:opacity-60"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#58a6ff]" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#0d1117] border-[#30363d] text-white disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white flex items-center gap-2">
                  <X className="h-4 w-4 text-[#58a6ff]" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#0d1117] border-[#30363d] text-white disabled:opacity-60"
                />
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label htmlFor="contact" className="text-white flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#58a6ff]" />
                  Contact
                </Label>
                <Input
                  id="contact"
                  type="text"
                  value={formData.contact}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#0d1117] border-[#30363d] text-white disabled:opacity-60"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-[#30363d]">
              <Button
                onClick={() => setDeleteAccountModal(true)}
                className="bg-[#da3633] hover:bg-[#f85149] text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>

              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          name: userInfo.name,
                          email: userInfo.email,
                          password: userInfo.password,
                          contact: userInfo.contact || "",
                        })
                      }}
                      className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-[#238636] hover:bg-[#2ea043] text-white"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#238636] hover:bg-[#2ea043] text-white">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteAccountModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost, including all your pets and their information."
        confirmText="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountModal(false)}
      />

      <DeleteConfirmationModal
        isOpen={deleteAvatarModal}
        title="Delete Avatar"
        message="Are you sure you want to delete your avatar? This action cannot be undone."
        confirmText="Delete Avatar"
        onConfirm={handleAvatarDelete}
        onCancel={() => setDeleteAvatarModal(false)}
      />
    </div>
  )
}
