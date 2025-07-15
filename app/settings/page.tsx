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
  password: string // Note: In a real app, you wouldn't typically receive the password back
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
  const [fileInputKey, setFileInputKey] = useState(0) // Key to force re-render of file input

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
  })

  useEffect(() => {
    loadUserInfo()
  }, [])

  const showTemporaryMessage = (message: string, type: "success" | "error") => {
    const messageDiv = document.createElement("div")
    messageDiv.className = `fixed top-4 right-4 px-4 py-2 rounded-lg z-50 ${
      type === "success" ? "bg-[#238636] text-white" : "bg-[#da3633] text-white"
    }`
    messageDiv.textContent = message
    document.body.appendChild(messageDiv)
    setTimeout(() => {
      document.body.removeChild(messageDiv)
    }, 2000)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    window.location.href = "/login"
  }

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
        console.log("loadUserInfo: User info loaded. Avatar from API:", data.responsible.avatar)
      } else {
        const errorData = await response.json()
        console.error("loadUserInfo: Error loading user info:", errorData.message || response.statusText)
        showTemporaryMessage(`Failed to load user info: ${errorData.message || "Please try again."}`, "error")
      }
    } catch (error) {
      console.error("loadUserInfo: Network error or unhandled exception:", error)
      showTemporaryMessage("Network error. Please check your connection and try again.", "error")
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
      const originalEmail = userInfo?.email
      const originalPassword = userInfo?.password

      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/update`,
        {
          method: "PUT",
          body: JSON.stringify(formData),
        },
      )
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.responsible)
        setIsEditing(false)
        showTemporaryMessage("Profile updated successfully!", "success")

        // Check if email or password has changed
        if (formData.email !== originalEmail || formData.password !== originalPassword) {
          showTemporaryMessage("Email or password changed. Redirecting to login...", "success")
          setTimeout(() => {
            handleLogout()
          }, 2000) // Give time for the message to be seen
        }
      } else {
        const errorData = await response.json()
        showTemporaryMessage(`Error updating profile: ${errorData.message || "Please try again."}`, "error")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      showTemporaryMessage("Network error. Please check your connection and try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/delete`,
        {
          method: "DELETE",
        },
      )
      if (response.ok) {
        showTemporaryMessage("Account deleted successfully!", "success")
        setTimeout(() => {
          handleLogout()
        }, 2000)
      } else {
        const errorData = await response.json()
        showTemporaryMessage(`Error deleting account: ${errorData.message || "Please try again."}`, "error")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      showTemporaryMessage("Network error. Please check your connection and try again.", "error")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, action: "upload" | "edit") => {
    const file = event.target.files?.[0]
    // Always increment key to ensure input is reset for next selection attempt
    setFileInputKey((prev) => prev + 1)

    if (!file) {
      console.log("handleFileSelect: No file selected or selection cancelled.")
      return
    }

    console.log(`handleFileSelect: File selected: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
      console.log("handleFileSelect: Avatar preview generated from selected file.")
    }
    reader.readAsDataURL(file)

    // Upload or edit the file
    if (action === "upload") {
      console.log("handleFileSelect: Calling handleAvatarUpload.")
      handleAvatarUpload(file)
    } else {
      console.log("handleFileSelect: Calling handleAvatarEdit.")
      handleAvatarEdit(file)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("avatar", file)
    console.log("handleAvatarUpload: Attempting to upload avatar...")
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/avatars/upload`, {
        method: "POST",
        body: formData,
      })
      console.log(`handleAvatarUpload: Response received: ${response.status} ${response.statusText}`)
      if (response.ok) {
        const data = await response.json()
        console.log("handleAvatarUpload: API response data:", data)
        // Update userInfo directly with the new imageUrl from the response
        setUserInfo((prev) => (prev ? { ...prev, avatar: data.imageUrl } : null))
        showTemporaryMessage("Avatar uploaded successfully!", "success")
        console.log("handleAvatarUpload: Avatar upload successful. User info updated directly.")
        // No need to call loadUserInfo here if the response already gives the new URL
      } else {
        const errorData = await response.json()
        showTemporaryMessage(`Error uploading avatar: ${errorData.message || "Please try again."}`, "error")
        console.error("handleAvatarUpload: Avatar upload failed:", errorData)
      }
    } catch (error) {
      console.error("handleAvatarUpload: Network error or unhandled exception:", error)
      showTemporaryMessage("Network error. Please check your connection and try again.", "error")
    } finally {
      setAvatarMenuOpen(false)
      setAvatarPreview(null) // Clear preview after operation (success or failure)
      console.log("handleAvatarUpload: Avatar menu closed and preview cleared.")
    }
  }

  const handleAvatarEdit = async (file: File) => {
    const formData = new FormData()
    formData.append("avatar", file)
    console.log("handleAvatarEdit: Attempting to edit avatar...")
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/avatars/update`, {
        method: "PUT",
        body: formData,
      })
      console.log(`handleAvatarEdit: Response received: ${response.status} ${response.statusText}`)
      if (response.ok) {
        const data = await response.json()
        console.log("handleAvatarEdit: API response data:", data)
        // Update userInfo directly with the new imageUrl from the response
        setUserInfo((prev) => (prev ? { ...prev, avatar: data.imageUrl } : null))
        showTemporaryMessage("Avatar updated successfully!", "success")
        console.log("handleAvatarEdit: Avatar edit successful. User info updated directly.")
        // No need to call loadUserInfo here if the response already gives the new URL
      } else {
        const errorData = await response.json()
        showTemporaryMessage(`Error updating avatar: ${errorData.message || "Please try again."}`, "error")
        console.error("handleAvatarEdit: Avatar edit failed:", errorData)
      }
    } catch (error) {
      console.error("handleAvatarEdit: Network error or unhandled exception:", error)
      showTemporaryMessage("Network error. Please check your connection and try again.", "error")
    } finally {
      setAvatarMenuOpen(false)
      setAvatarPreview(null) // Clear preview after operation (success or failure)
      console.log("handleAvatarEdit: Avatar menu closed and preview cleared.")
    }
  }

  const handleAvatarDelete = async () => {
    console.log("handleAvatarDelete: Attempting to delete avatar...")
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/avatars/delete`, {
        method: "DELETE",
      })
      console.log(`handleAvatarDelete: Response received: ${response.status} ${response.statusText}`)
      if (response.ok) {
        // On successful delete, set avatar to null
        setUserInfo((prev) => (prev ? { ...prev, avatar: null } : null))
        showTemporaryMessage("Avatar deleted successfully!", "success")
        console.log("handleAvatarDelete: Avatar deletion successful. User info updated directly (avatar: null).")
      } else {
        const errorData = await response.json()
        showTemporaryMessage(`Error deleting avatar: ${errorData.message || "Please try again."}`, "error")
        console.error("handleAvatarDelete: Avatar deletion failed:", errorData)
      }
    } catch (error) {
      console.error("handleAvatarDelete: Network error or unhandled exception:", error)
      showTemporaryMessage("Network error. Please check your connection and try again.", "error")
    } finally {
      setDeleteAvatarModal(false)
      setAvatarMenuOpen(false)
      console.log("handleAvatarDelete: Delete modal closed and avatar menu closed.")
    }
  }

  const handleBack = () => {
    window.location.href = "/home"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header userInfo={userInfo} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-[#8b949e]">Loading settings...</div>
        </div>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header userInfo={userInfo} />
        <div className="flex items-center justify-center py-20">
          <p className="text-[#f85149]">Failed to load user information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header userInfo={userInfo} />
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
            <div className="relative group">
              <img
                src={
                  avatarPreview ||
                  (userInfo.avatar ? `${userInfo.avatar}?_=${Date.now()}` : "/placeholder.svg?height=128&width=128")
                }
                alt={userInfo.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-[#30363d] transition-all duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=128&width=128"
                  console.error("Image failed to load. Setting placeholder. Current src:", target.src)
                }}
              />
              <DropdownMenu open={avatarMenuOpen} onOpenChange={setAvatarMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Change avatar"
                    className="absolute bottom-0 right-0 p-2 bg-[#21262d] hover:bg-[#30363d] rounded-full border border-[#30363d] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#161b22] border-[#30363d] text-white">
                  {userInfo.avatar ? (
                    <>
                      <DropdownMenuItem asChild className="hover:bg-[#21262d] cursor-pointer">
                        <label className="flex items-center px-2 py-1.5 text-sm cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Avatar
                          <input
                            key={`file-input-${fileInputKey}`} // Key to force re-render
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
                  ) : (
                    <DropdownMenuItem asChild className="hover:bg-[#21262d] cursor-pointer">
                      <label className="flex items-center px-2 py-1.5 text-sm cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Avatar
                        <input
                          key={`file-input-${fileInputKey}`} // Key to force re-render
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, "upload")}
                          className="hidden"
                        />
                      </label>
                    </DropdownMenuItem>
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
                  type={isEditing ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#0d1117] border-[#30363d] text-white disabled:opacity-60"
                  placeholder="Enter new password to change"
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
                        setAvatarPreview(null) // Clear avatar preview on cancel
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
