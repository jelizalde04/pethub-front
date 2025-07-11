"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Weight,
  Heart,
  Stethoscope,
  Shield,
  Pill,
  AlertTriangle,
  Save,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { Header } from "@/components/header"

interface MedicalRecord {
  id: string
  petId: string
  lastVisitDate: string
  weight: number
  healthStatus: string
  diseases: string
  treatments: string
  vaccinations: string
  allergies: string
  specialCare: string
  sterilized: boolean
  createdAt: string
}

export default function UpdateMedicalRecordPage() {
  const params = useParams()
  const petId = params.petId as string

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    lastVisitDate: "",
    weight: "",
    healthStatus: "",
    diseases: "",
    treatments: "",
    vaccinations: "",
    allergies: "",
    specialCare: "",
    sterilized: false,
  })

  useEffect(() => {
    if (petId) {
      loadCurrentRecord()
    }
  }, [petId])

  const loadCurrentRecord = async () => {
    try {
      setIsLoadingData(true)
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_MEDICAL_API_URL_TRES}/medical/lastest/${petId}`,
      )

      if (response.ok) {
        const record: MedicalRecord = await response.json()
        setFormData({
          lastVisitDate: record.lastVisitDate.split("T")[0], // Format date for input
          weight: record.weight.toString(),
          healthStatus: record.healthStatus,
          diseases: record.diseases,
          treatments: record.treatments,
          vaccinations: record.vaccinations,
          allergies: record.allergies,
          specialCare: record.specialCare,
          sterilized: record.sterilized,
        })
      } else {
        alert("Error loading current medical record")
        window.location.href = `/pet/${petId}`
      }
    } catch (error) {
      console.error("Error loading medical record:", error)
      alert("Network error. Please try again.")
      window.location.href = `/pet/${petId}`
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        petId,
        lastVisitDate: new Date(formData.lastVisitDate).toISOString(),
        weight: Number.parseFloat(formData.weight),
        healthStatus: formData.healthStatus,
        diseases: formData.diseases,
        treatments: formData.treatments,
        vaccinations: formData.vaccinations,
        allergies: formData.allergies,
        specialCare: formData.specialCare,
        sterilized: formData.sterilized,
      }

      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_MEDICAL_API_URL_DOS}/medical/update`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Medical record updated successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
          window.location.href = `/pet/${petId}`
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error updating medical record: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error updating medical record:", error)
      alert("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    window.location.href = `/pet/${petId}`
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
            <p className="text-[#8b949e]">Loading medical record...</p>
          </div>
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
            <h1 className="text-2xl font-bold text-white">Update Medical Record</h1>
            <p className="text-[#8b949e]">Update medical information for this pet</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Last Visit Date */}
            <div className="space-y-2">
              <Label htmlFor="lastVisitDate" className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#58a6ff]" />
                Last Visit Date
              </Label>
              <Input
                id="lastVisitDate"
                type="date"
                value={formData.lastVisitDate}
                onChange={(e) => handleInputChange("lastVisitDate", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                required
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-white flex items-center gap-2">
                <Weight className="h-4 w-4 text-[#58a6ff]" />
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                placeholder="Enter weight in kg"
                required
              />
            </div>

            {/* Health Status */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="healthStatus" className="text-white flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#58a6ff]" />
                Health Status
              </Label>
              <Textarea
                id="healthStatus"
                value={formData.healthStatus}
                onChange={(e) => handleInputChange("healthStatus", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                placeholder="Describe the current health status"
                rows={3}
                required
              />
            </div>

            {/* Diseases */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="diseases" className="text-white flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-[#f85149]" />
                Diseases
              </Label>
              <Textarea
                id="diseases"
                value={formData.diseases}
                onChange={(e) => handleInputChange("diseases", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                placeholder="List any diseases or conditions"
                rows={3}
              />
            </div>

            {/* Treatments */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="treatments" className="text-white flex items-center gap-2">
                <Pill className="h-4 w-4 text-[#58a6ff]" />
                Treatments
              </Label>
              <Textarea
                id="treatments"
                value={formData.treatments}
                onChange={(e) => handleInputChange("treatments", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                placeholder="List current treatments and medications"
                rows={3}
              />
            </div>

            {/* Vaccinations */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="vaccinations" className="text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#2ea043]" />
                Vaccinations
              </Label>
              <Textarea
                id="vaccinations"
                value={formData.vaccinations}
                onChange={(e) => handleInputChange("vaccinations", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                placeholder="List all vaccinations"
                rows={3}
              />
            </div>

            {/* Allergies */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="allergies" className="text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#f85149]" />
                Allergies
              </Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange("allergies", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                placeholder="List any known allergies"
                rows={2}
              />
            </div>

            {/* Special Care */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="specialCare" className="text-white flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#f85149]" />
                Special Care
              </Label>
              <Textarea
                id="specialCare"
                value={formData.specialCare}
                onChange={(e) => handleInputChange("specialCare", e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-white"
                placeholder="Describe any special care requirements"
                rows={3}
              />
            </div>

            {/* Sterilized */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between p-4 bg-[#21262d] rounded-lg">
                <Label htmlFor="sterilized" className="text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#58a6ff]" />
                  Sterilized
                </Label>
                <Switch
                  id="sterilized"
                  checked={formData.sterilized}
                  onCheckedChange={(checked) => handleInputChange("sterilized", checked)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[#30363d]">
            <Button
              type="button"
              onClick={handleBack}
              className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#238636] hover:bg-[#2ea043] text-white">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Record
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
