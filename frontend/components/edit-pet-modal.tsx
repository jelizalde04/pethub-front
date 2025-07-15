"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Loader2, CalendarIcon, AlertCircle, Save, Camera } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { makeAuthenticatedRequest } from "@/utils/auth"
import Select from "react-select"
import { PET_BREEDS, SPECIES_OPTIONS } from "@/data/pet-breeds"

interface Responsible {
  id: string
  name: string
  email: string
  password: string
  contact: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  image: string
  birthdate: string
  residence: string | null
  gender: string
  color: string | null
  responsibleId: string
  createdAt: string
  updatedAt: string
  responsible: Responsible
  followersCount?: number
}

interface EditPetModalProps {
  isOpen: boolean
  pet: Pet
  onClose: () => void
  onSuccess: (updatedPet: Pet) => void
}

interface SelectOption {
  value: string
  label: string
}

export function EditPetModal({ isOpen, pet, onClose, onSuccess }: EditPetModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    birthdate: undefined as Date | undefined,
  })

  // Image state
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Select states
  const [selectedSpecies, setSelectedSpecies] = useState<SelectOption | null>(null)
  const [selectedBreed, setSelectedBreed] = useState<SelectOption | null>(null)
  const [availableBreeds, setAvailableBreeds] = useState<SelectOption[]>([])

  useEffect(() => {
    if (isOpen && pet) {
      // Initialize form data
      setFormData({
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthdate: new Date(pet.birthdate),
      })

      // Set species and breed selects
      const speciesOption = SPECIES_OPTIONS.find((s) => s.value === pet.species)
      if (speciesOption) {
        setSelectedSpecies(speciesOption)
        const breeds = PET_BREEDS[pet.species as keyof typeof PET_BREEDS] || []
        setAvailableBreeds(breeds)

        const breedOption = breeds.find((b) => b.value === pet.breed)
        if (breedOption) {
          setSelectedBreed(breedOption)
        }
      }

      // Reset states
      setNewImage(null)
      setImagePreview(null)
      setErrors({})
      setGeneralError(null)
      setSuccessMessage(null)
    }
  }, [isOpen, pet])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear errors
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      birthdate: date,
    }))
    if (errors.birthdate) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.birthdate
        return newErrors
      })
    }
  }

  const handleSpeciesChange = (option: SelectOption | null) => {
    setSelectedSpecies(option)
    setSelectedBreed(null)
    setAvailableBreeds([])

    if (option) {
      setFormData((prev) => ({
        ...prev,
        species: option.value,
        breed: "",
      }))

      const breeds = PET_BREEDS[option.value as keyof typeof PET_BREEDS] || []
      setAvailableBreeds(breeds)
    }
  }

  const handleBreedChange = (option: SelectOption | null) => {
    setSelectedBreed(option)
    if (option) {
      setFormData((prev) => ({
        ...prev,
        breed: option.value,
      }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, image: "Please select a valid image file." }))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Image size must be less than 5MB." }))
        return
      }

      setNewImage(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      if (errors.image) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.image
          return newErrors
        })
      }
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setGeneralError(null)
      setSuccessMessage(null)

      // Validate form
      const newErrors: Record<string, string> = {}
      if (!formData.name.trim()) newErrors.name = "Pet name is required"
      if (!formData.species) newErrors.species = "Species is required"
      if (!formData.breed) newErrors.breed = "Breed is required"
      if (!formData.birthdate) newErrors.birthdate = "Birthdate is required"

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      // Update basic fields first
      const updateData = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed,
        birthdate: formData.birthdate?.toISOString().split("T")[0],
      }

      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/update/${pet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setGeneralError(errorData.message || "Error updating pet profile")
        return
      }

      let updatedImageUrl = pet.image

      // Update image if new image was selected
      if (newImage) {
        const imageFormData = new FormData()
        imageFormData.append("image", newImage)

        const imageResponse = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/update/image/${pet.id}`,
          {
            method: "PUT",
            body: imageFormData,
          },
        )

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json()
          updatedImageUrl = imageResult.imageUrl
        } else {
          const errorData = await imageResponse.json()
          setGeneralError(errorData.message || "Error updating image")
          return
        }
      }

      // Create updated pet object
      const updatedPet: Pet = {
        ...pet,
        ...updateData,
        image: updatedImageUrl,
        birthdate: updateData.birthdate + "T00:00:00.000Z",
      }

      setSuccessMessage("Pet profile updated successfully!")

      setTimeout(() => {
        onSuccess(updatedPet)
      }, 1000)
    } catch (error) {
      console.error("Error updating pet:", error)
      setGeneralError("Network error. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Custom styles for react-select
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: "#0d1117",
      borderColor: "#30363d",
      borderWidth: "1px",
      borderRadius: "8px",
      minHeight: "44px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(31, 111, 235, 0.3)" : "none",
      fontSize: "14px",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "8px",
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#1f6feb" : state.isFocused ? "#21262d" : "transparent",
      color: "#ffffff",
      fontSize: "14px",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#ffffff",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#8b949e",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "#ffffff",
    }),
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
          <h2 className="text-xl font-semibold text-white">Edit {pet.name}'s Profile</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-[#8b949e] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-[#238636] bg-opacity-15 border border-[#2ea043] rounded-lg p-4 text-sm mb-6">
              <div className="flex items-center gap-2 text-[#2ea043]">
                <Save className="h-4 w-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {generalError && (
            <div className="bg-[#da3633] bg-opacity-15 border border-[#f85149] rounded-lg p-4 text-sm mb-6">
              <div className="flex items-center gap-2 text-[#f85149]">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{generalError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Section */}
            <div>
              <Label className="text-sm font-medium text-[#f0f6fc] mb-3 block">Pet Photo</Label>
              <div className="space-y-4">
                <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-[#30363d] bg-[#21262d]">
                  <img
                    src={imagePreview || pet.image || "/placeholder.svg?height=300&width=300"}
                    alt={`${pet.name}'s photo`}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=300&width=300"
                    }}
                  />
                </div>

                <div className="border-2 border-dashed border-[#30363d] rounded-lg p-4 text-center hover:border-[#58a6ff] transition-colors">
                  <Camera className="h-8 w-8 text-[#8b949e] mx-auto mb-2" />
                  <p className="text-sm text-[#8b949e] mb-3">Click to upload new photo</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
                  >
                    Choose file
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {errors.image && <p className="text-[#f85149] text-sm">{errors.image}</p>}
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-5">
              {/* Pet Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-[#f0f6fc] mb-2 block">
                  Pet Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-[#0d1117] border-[#30363d] text-white h-11 rounded-lg"
                  placeholder="Enter pet name"
                />
                {errors.name && <p className="text-[#f85149] text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Species */}
              <div>
                <Label className="text-sm font-medium text-[#f0f6fc] mb-2 block">Species</Label>
                <Select
                  options={SPECIES_OPTIONS}
                  value={selectedSpecies}
                  onChange={handleSpeciesChange}
                  placeholder="Select species"
                  styles={selectStyles}
                  isSearchable
                />
                {errors.species && <p className="text-[#f85149] text-sm mt-1">{errors.species}</p>}
              </div>

              {/* Breed */}
              <div>
                <Label className="text-sm font-medium text-[#f0f6fc] mb-2 block">Breed</Label>
                <Select
                  options={availableBreeds}
                  value={selectedBreed}
                  onChange={handleBreedChange}
                  placeholder="Select breed"
                  styles={selectStyles}
                  isSearchable
                  isDisabled={!selectedSpecies}
                />
                {errors.breed && <p className="text-[#f85149] text-sm mt-1">{errors.breed}</p>}
              </div>

              {/* Birthdate */}
              <div>
                <Label className="text-sm font-medium text-[#f0f6fc] mb-2 block">Birthdate</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-[#0d1117] border text-white hover:bg-[#21262d] border-[#30363d] h-11 rounded-lg",
                        !formData.birthdate && "text-[#8b949e]",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthdate ? format(formData.birthdate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#161b22] border-[#30363d]">
                    <Calendar
                      mode="single"
                      selected={formData.birthdate}
                      onSelect={handleDateChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
                {errors.birthdate && <p className="text-[#f85149] text-sm mt-1">{errors.birthdate}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#30363d]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#238636] hover:bg-[#2ea043] text-white">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
