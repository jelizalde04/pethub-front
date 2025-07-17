"use client"

import { useState } from "react"
import { Search, Plus, Settings, PawPrint, Bell, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserProfileModal } from "@/components/user-profile-modal"

interface HeaderProps {
  userInfo?: {
    id: string
    name: string
    email: string 
    avatar: string | null
  } | null
  currentPage?: string
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function Header({ userInfo, currentPage = "home", searchQuery = "", onSearchChange }: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const pathname = usePathname()
  const isPetsPage = pathname === "/pets"
  const isHomePage = pathname === "/home"
  const isPetPage = pathname.startsWith("/pet")
  
  // Páginas donde se oculta la navegación
  const hideNavigationPages = [
    "/pets",
    "/create-medical",
    "/create-pet", 
    "/update-medical",
    "/settings",
    "/public-pet"
  ]
  
  const shouldHideNavigation = hideNavigationPages.some(page => 
    pathname === page || pathname.startsWith(page)
  )

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("selectedPetId")
    window.location.href = "/login"
  }

  const handleNavigation = (path: string) => {
    window.location.href = path
  }

  const handleProfileClick = () => {
    setShowUserDropdown(false)
    setShowProfileModal(true)
  }

  const handleMyProfileClick = () => {
    const selectedPetId = localStorage.getItem("selectedPetId")
    if (selectedPetId) {
      window.location.href = `/pet/${selectedPetId}`
    } else {
      // Si no hay mascota seleccionada, redirigir a pets
      window.location.href = "/pets"
    }
  }

  const navItems = [
    { name: "Home", path: "/home", key: "home" },
    { name: "My Pet Profile", action: handleMyProfileClick, key: "profile" },
    { name: "Notifications", path: "/notifications", key: "notifications" },
  ]

  return (
    <>
      <header className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          {/* Logo */}
          <button
            onClick={() => handleNavigation("/home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <PawPrint className="h-8 w-8 text-white" />
            <span className="text-white font-semibold text-xl">PetHub</span>
          </button>

          {/* Navigation - Oculta en páginas específicas */}
          {!shouldHideNavigation && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => (item.action ? item.action() : handleNavigation(item.path!))}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPage === item.key
                      ? "text-white bg-[#21262d]"
                      : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          )}

          {/* Search Bar - Oculta en páginas específicas */}
          {!shouldHideNavigation && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
                <Input
                  type="text"
                  placeholder="Search pets, breeds, or owners..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-10 bg-[#0d1117] border-[#30363d] text-white placeholder-[#8b949e] focus:border-[#1f6feb] focus:ring-[#1f6feb] h-9"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
        
            {/* User Avatar */}
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
                <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-[#21262d] cursor-pointer">
                  Your profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation("/pets")}
                  className="hover:bg-[#21262d] cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Close this profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#30363d]" />
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
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-[#f85149] hover:bg-[#da3633] hover:bg-opacity-15 cursor-pointer"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  )
}