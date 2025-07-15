"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { PetHubLogo } from "@/components/ui/pethub-logo"
interface LoginData {
  email: string
  password: string
}

interface ValidationError {
  type: string
  value: string
  msg: string
  path: string
  location: string
}

interface ApiErrorResponse {
  error: string
  details?: ValidationError[]
  message?: string
  detail?: string
}

interface ApiSuccessResponse {
  token: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    if (generalError) setGeneralError(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format."
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setGeneralError(null)

    try {
      // Direct call to your backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data: ApiErrorResponse | ApiSuccessResponse = await response.json()

      if (response.ok) {
        const successData = data as ApiSuccessResponse

        // Store token in localStorage
        localStorage.setItem("authToken", successData.token)

        setSuccess(true)

        // Show success message and redirect to home after 1 second
        setTimeout(() => {
          window.location.href = "/pets"
        }, 1000)
      } else {
        const errorData = data as ApiErrorResponse

        // Handle specific 401 error from your FastAPI backend
        if (response.status === 401) {
          setGeneralError(errorData.detail || "Invalid email or password. Please try again.")
        } else if (errorData.details && Array.isArray(errorData.details)) {
          // Handle validation errors from backend
          const newErrors: Record<string, string> = {}
          errorData.details.forEach((error: ValidationError) => {
            newErrors[error.path] = error.msg
          })
          setErrors(newErrors)
        } else {
          // Handle other general errors
          setGeneralError(errorData.message || errorData.error || "Login failed. Please try again.")
        }
      }
    } catch (err) {
      setGeneralError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* GitHub Logo */}
          <div className="text-center mb-8">
            <svg
              height="48"
              aria-hidden="true"
              viewBox="0 0 16 16"
              version="1.1"
              width="48"
              className="mx-auto fill-white"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </div>

          {/* Success Message */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
            <div className="text-green-500 text-2xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-white mb-2">Login successful!</h1>
            <p className="text-[#8b949e] text-sm mb-6">Welcome back to PetHub. Redirecting to home...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
    {/* PetHub Logo */}
      <div className="flex justify-center mb-12">
        <PetHubLogo size={80} />
</div>

        {/* Sign in form */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h1 className="text-2xl font-light text-center text-white mb-4">Sign in to PetHub</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <div className="bg-[#da3633] bg-opacity-15 border border-[#f85149] rounded-md p-3 text-sm">
                <div className="flex items-center gap-2 text-[#f85149]">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{generalError}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-[#f0f6fc] mb-2">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={`w-full px-3 py-2 bg-[#0d1117] border rounded-md text-white placeholder-[#8b949e] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] ${
                  errors.email ? "border-[#f85149]" : "border-[#30363d]"
                }`}
              />
              {errors.email && (
                <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="password" className="block text-sm font-medium text-[#f0f6fc]">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className={`w-full px-3 py-2 pr-10 bg-[#0d1117] border rounded-md text-white placeholder-[#8b949e] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] ${
                    errors.password ? "border-[#f85149]" : "border-[#30363d]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8b949e] hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#30363d] text-center">
            <p className="text-sm text-[#8b949e]">
              New to PetHub?{" "}
              <a href="/register" className="text-[#58a6ff] hover:underline">
                Create an account
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-4 text-xs text-[#8b949e]">
            <a href="#" className="hover:text-[#58a6ff] hover:underline">
              Terms
            </a>
            <a href="#" className="hover:text-[#58a6ff] hover:underline">
              Privacy
            </a>
            <a href="#" className="hover:text-[#58a6ff] hover:underline">
              Security
            </a>
            <a href="#" className="hover:text-[#58a6ff] hover:underline">
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
