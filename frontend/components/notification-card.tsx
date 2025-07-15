"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Bell, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  userId: string
  message: string
  read: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationCardProps {
  notification: Notification
  onClick: (notificationId: string) => void
  isExpanded: boolean
}

export function NotificationCard({ notification, onClick, isExpanded }: NotificationCardProps) {
  const handleCardClick = () => {
    onClick(notification.id)
  }

  // Safe check for message
  const message = notification?.message || ""
  const messagePreview = message.length > 60 ? `${message.substring(0, 60)}...` : message

  return (
    <Card
      className={cn(
        "bg-[#161b22] border border-[#30363d] text-white rounded-lg shadow-md cursor-pointer transition-all duration-200",
        !notification.read ? "hover:border-[#58a6ff] hover:shadow-lg hover:shadow-[#58a6ff]/10" : "opacity-70",
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {notification.read ? (
              <CheckCircle2 className="h-6 w-6 text-[#238636]" />
            ) : (
              <Bell className="h-6 w-6 text-[#58a6ff]" />
            )}
          </div>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-sm font-medium",
                !notification.read ? "text-white" : "text-[#8b949e]"
              )}>
                {notification.read ? "Read" : "New notification"}
              </p>
              <p className="text-xs text-[#8b949e]">
                {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : ""}
              </p>
            </div>
            
            {/* Show preview or full content based on expanded state */}
            {isExpanded ? (
              <div className="mt-2">
                <p className={cn(
                  "text-base",
                  !notification.read ? "font-semibold text-white" : "font-normal text-[#8b949e]"
                )}>
                  {message}
                </p>
              </div>
            ) : (
              <p className={cn(
                "text-sm mt-1 truncate",
                !notification.read ? "text-[#8b949e]" : "text-[#6e7681]"
              )}>
                {messagePreview}
              </p>
            )}
            
            {!isExpanded && message.length > 60 && (
              <p className="text-xs text-[#58a6ff] mt-1">
                Click to read more
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}