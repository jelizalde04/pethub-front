"use client"

import type React from "react"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, Weight, Heart, Stethoscope, Shield, Pill, AlertTriangle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { Header } from "@/components/header"

export default function CreateMedicalRecordPage() {
  const params = useParams()
  const petId = params.petId as string

  const [isLoading, setIsLoading] = useState(false)
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
        lastVisitDate: formData.lastVisitDate,
        weight: Number.parseFloat(formData.weight),
        healthStatus: formData.healthStatus,
        diseases: formData.diseases,
        treatments: formData.treatments,
        vaccinations: formData.vaccinations,
        allergies: formData.allergies,
        specialCare: formData.specialCare,
        sterilized: formData.sterilized,
      }

      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_DOS}/medical/create`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Medical record created successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
          window.location.href = `/pet/${petId}`
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error creating medical record: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error creating medical record:", error)
      alert("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    window.location.href = `/pet/${petId}`
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
            <h1 className="text-2xl font-bold text-white">Create Medical Record</h1>
            <p className="text-[#8b949e]">Add medical information for this pet</p>
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Record
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
