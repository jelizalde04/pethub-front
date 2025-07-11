// Utility functions for authentication
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken")
  }
  return null
}

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token)
  }
}

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken")
  }
}

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null
}

// Function to make authenticated API requests
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()

  console.log("makeAuthenticatedRequest called with:")
  console.log("URL:", url)
  console.log("Token exists:", !!token)

  if (!token) {
    console.error("No authentication token found")
    throw new Error("No authentication token found")
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...((options.headers as Record<string, string>) || {}),
  }

  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  console.log("Request headers:", headers)
  console.log("Request options:", options)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  console.log("Response received:", response.status, response.statusText)

  return response
}
