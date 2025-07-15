import { jwtDecode } from "jwt-decode"

// Define a type for the JWT payload, assuming it has a userId
interface JwtPayload {
  userId: string
  // Add other properties if your token contains them, e.g., exp, iat
}

/**
 * Decodes a JWT token and returns its payload.
 * @param token The JWT string.
 * @returns The decoded payload or null if decoding fails.
 */
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token)
  } catch (error) {
    console.error("Failed to decode JWT:", error)
    return null
  }
}

/**
 * Retrieves the authentication token from localStorage and extracts the userId from it.
 * @returns The userId string or null if the token is not found or cannot be decoded.
 */
export const getUserIdFromToken = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }
  const token = localStorage.getItem("authToken")
  if (!token) {
    return null
  }
  const decoded = decodeJwt(token)
  return decoded ? decoded.userId : null
}
