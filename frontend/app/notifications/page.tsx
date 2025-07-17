"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Bell, ChevronDown, ChevronUp } from "lucide-react"
import { getUserIdFromToken } from "@/lib/jwt" 
import { cn } from "@/lib/utils" 
import { Header } from "@/components/header" 
import { useSearch } from "@/hooks/useSearch"

interface Notification {
  actorId: string
  content: string
  id: string
  read: boolean
  recipientId: string
  responsibleId: string
  timestamp: string
  type: string
}

interface NotificationsResponse {
  count: number
  notifications: Notification[]
}

interface UserInfo {
  id: string
  name: string
  email: string
  avatar: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const NOTIFICATIONS_API_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_UNO

  // Hook de búsqueda
  const { filteredData: filteredNotifications, totalResults } = useSearch({
    data: notifications,
    searchFields: ['content', 'type'],
    searchQuery
  })

  // Fetch user info for header
    const fetchUserInfo = useCallback(async () => {
  try {
    const token = localStorage.getItem("authToken")
    if (!token) return null

    const response = await fetch(`${API_BASE_URL}/responsibles/getId`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      setUserInfo(data.responsible)
      return data.responsible.id
    } else {
      return null
    }
  } catch (err) {
    console.warn("Error fetching user info:", err)
    return null
  }
}, [API_BASE_URL])

const fetchNotifications = useCallback(async () => {
  setLoading(true)
  setError(null)

  try {
    const userId = await fetchUserInfo()
    if (!userId) {
      setError("User ID not found. Please log in again.")
      setLoading(false)
      return
    }

    const token = localStorage.getItem("authToken")
    if (!token) {
      throw new Error("Authentication token not found.")
    }

    const response = await fetch(`${NOTIFICATIONS_API_URL}/notifications/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to fetch notifications.")
    }

    const data: NotificationsResponse = await response.json()
    const sortedNotifications = data.notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    setNotifications(sortedNotifications)
  } catch (err) {
    console.error("Error fetching notifications:", err)
    setError((err as Error).message || "Failed to load notifications.")
  } finally {
    setLoading(false)
  }
}, [NOTIFICATIONS_API_URL, fetchUserInfo])

const markNotificationAsRead = useCallback(
  async (notificationId: string) => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        console.warn("Authentication token not found for marking as read.")
        return
      }

      const userId = await fetchUserInfo()
      if (!userId) {
        console.warn("User ID not found, cannot mark notification as read.")
        return
      }

      const response = await fetch(`${NOTIFICATIONS_API_URL}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ read: true }),
      })

      if (!response.ok) {
        console.warn("Failed to mark notification as read")
        return
      }

      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    } catch (err) {
      console.warn("Error marking notification as read:", err)
    }
  },
  [NOTIFICATIONS_API_URL, fetchUserInfo]
)

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id)
    }
    setExpandedNotificationId((prevId) => (prevId === notification.id ? null : notification.id))
  }

  useEffect(() => {
    fetchUserInfo()
    fetchNotifications()
  }, [fetchUserInfo, fetchNotifications])

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <Header 
        userInfo={userInfo} 
        currentPage="notifications"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-grow flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-2xl">
          <Card className="bg-[#161b22] border border-[#30363d] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-2xl font-light flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notifications
                {searchQuery && (
                  <span className="text-sm font-normal text-[#8b949e] ml-2">
                    ({totalResults} results)
                  </span>
                )}
              </CardTitle>
              <button
                onClick={fetchNotifications}
                className="px-3 py-1 text-sm bg-[#21262d] hover:bg-[#30363d] rounded-md transition-colors"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8 text-[#8b949e]">Loading notifications...</div>}
              {error && (
                <div className="bg-[#da3633] bg-opacity-15 border border-[#f85149] rounded-md p-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-[#f85149]">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              {!loading && notifications.length === 0 && !error && (
                <div className="text-center py-8 text-[#8b949e]">No notifications yet.</div>
              )}
              {!loading && searchQuery && filteredNotifications.length === 0 && notifications.length > 0 && (
                <div className="text-center py-8 text-[#8b949e]">
                  No notifications found for "{searchQuery}".
                </div>
              )}
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredNotifications.map((notification) => {
                  const isExpanded = expandedNotificationId === notification.id
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-md cursor-pointer transition-colors",
                        notification.read
                          ? "bg-[#0d1117] text-[#8b949e]"
                          : "bg-[#1f6feb] bg-opacity-20 text-white border border-[#1f6feb] hover:bg-opacity-30",
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-grow">
                          <Bell className={cn("h-5 w-5", notification.read ? "text-[#8b949e]" : "text-[#58a6ff]")} />
                          <p className="text-sm font-medium flex-grow">
                            {isExpanded ? (
                              notification.content
                            ) : (
                              notification.read 
                                ? `${notification.content.substring(0, 100)}${notification.content.length > 100 ? "..." : ""}`
                                : "You have a new notification"
                            )}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {!notification.read && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-green-600 rounded-full">New</span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[#8b949e]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#8b949e]" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-right mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}