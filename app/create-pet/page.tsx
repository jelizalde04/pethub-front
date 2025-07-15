"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Upload, Loader2, CalendarIcon, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { makeAuthenticatedRequest } from "@/utils/auth"
import Select from "react-select"
import { Country, State, City } from "country-state-city"
import { PET_BREEDS, SPECIES_OPTIONS } from "@/data/pet-breeds"
import { Header } from "@/components/header"

interface PetFormData {
  name: string
  species: string
  breed: string
  birthdate: Date | undefined
  residence: string
  gender: string
  color: string
  image: File | null
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
}

interface ApiSuccessResponse {
  id: string
  name: string
  breed: string
  species: string
  birthdate: string
  residence: string
  gender: string
  color: string
  image: string
  responsibleId: string
  createdAt: string
  updatedAt: any
}

interface SelectOption {
  value: string
  label: string
}

interface CountryOption extends SelectOption {
  isoCode: string
}

interface CityOption extends SelectOption {
  countryCode: string
  stateCode: string
}

export default function CreatePetPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Location state
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null)
  const [selectedState, setSelectedState] = useState<SelectOption | null>(null)
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null)
  const [availableStates, setAvailableStates] = useState<SelectOption[]>([])
  const [availableCities, setAvailableCities] = useState<CityOption[]>([])

  // Pet data state
  const [selectedSpecies, setSelectedSpecies] = useState<SelectOption | null>(null)
  const [selectedBreed, setSelectedBreed] = useState<SelectOption | null>(null)
  const [availableBreeds, setAvailableBreeds] = useState<SelectOption[]>([])

  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    species: "",
    breed: "",
    birthdate: undefined,
    residence: "",
    gender: "",
    color: "",
    image: null,
  })

  const [userInfo, setUserInfo] = useState<any>(null)

  const loadUserInfo = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/responsibles/getId`)
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.responsible)
      }
    } catch (error) {
      console.error("Error loading user info:", error)
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("authToken")
    if (!authToken) {
      window.location.href = "/login"
      return
    }

    loadUserInfo()
  }, [])

  // Prepare country options
  const countryOptions: CountryOption[] = Country.getAllCountries().map((country) => ({
    value: country.name,
    label: country.name,
    isoCode: country.isoCode,
  }))

  // Handle country selection
  const handleCountryChange = (option: CountryOption | null) => {
    setSelectedCountry(option)
    setSelectedState(null)
    setSelectedCity(null)
    setAvailableStates([])
    setAvailableCities([])

    if (option) {
      const states = State.getStatesOfCountry(option.isoCode).map((state) => ({
        value: state.name,
        label: state.name,
        isoCode: state.isoCode,
      }))
      setAvailableStates(states)

      // If no states, get cities directly
      if (states.length === 0) {
        const cities =
          City.getCitiesOfCountry(option.isoCode)?.map((city) => ({
            value: city.name,
            label: city.name,
            countryCode: city.countryCode,
            stateCode: city.stateCode || "",
          })) || []
        setAvailableCities(cities)
      }
    }

    // Clear residence error
    if (errors.residence) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.residence
        return newErrors
      })
    }
  }

  // Handle state selection
  const handleStateChange = (option: any) => {
    setSelectedState(option)
    setSelectedCity(null)
    setAvailableCities([])

    if (option && selectedCountry) {
      const cities =
        City.getCitiesOfState(selectedCountry.isoCode, option.isoCode)?.map((city) => ({
          value: city.name,
          label: city.name,
          countryCode: city.countryCode,
          stateCode: city.stateCode,
        })) || []
      setAvailableCities(cities)
    }
  }

  // Handle city selection
  const handleCityChange = (option: CityOption | null) => {
    setSelectedCity(option)
    if (option) {
      const residenceString = selectedState
        ? `${option.label}, ${selectedState.label}, ${selectedCountry?.label}`
        : `${option.label}, ${selectedCountry?.label}`

      setFormData((prev) => ({
        ...prev,
        residence: residenceString,
      }))
    }
  }

  // Handle species selection
  const handleSpeciesChange = (option: SelectOption | null) => {
    setSelectedSpecies(option)
    setSelectedBreed(null)
    setAvailableBreeds([])

    if (option) {
      setFormData((prev) => ({
        ...prev,
        species: option.value,
        breed: "", // Reset breed when species changes
      }))

      // Get breeds based on species from our data
      const breeds = PET_BREEDS[option.value as keyof typeof PET_BREEDS] || []
      setAvailableBreeds(breeds)
    }

    // Clear species error
    if (errors.species) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.species
        return newErrors
      })
    }
  }

  // Handle breed selection
  const handleBreedChange = (option: SelectOption | null) => {
    setSelectedBreed(option)
    if (option) {
      setFormData((prev) => ({
        ...prev,
        breed: option.value,
      }))
    }

    // Clear breed error
    if (errors.breed) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.breed
        return newErrors
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      birthdate: date,
    }))
    // Clear birthdate error
    if (errors.birthdate) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.birthdate
        return newErrors
      })
    }
    if (generalError) setGeneralError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, image: "Please select a valid image file." }))
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Image size must be less than 5MB." }))
        return
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
      }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Clear image error
      if (errors.image) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.image
          return newErrors
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Pet name is required."
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Pet name must be at least 2 characters long."
    }

    // Species validation
    if (!formData.species) {
      newErrors.species = "Please select a species."
    }

    // Breed validation
    if (!formData.breed) {
      newErrors.breed = "Please select a breed."
    }

    // Birthdate validation
    if (!formData.birthdate) {
      newErrors.birthdate = "Please select a birthdate."
    } else if (formData.birthdate > new Date()) {
      newErrors.birthdate = "Birthdate cannot be in the future."
    }

    // Residence validation
    if (!formData.residence) {
      newErrors.residence = "Please select a residence."
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = "Please select a gender."
    }

    // Color validation
    if (!formData.color.trim()) {
      newErrors.color = "Pet color is required."
    }

    // Image validation
    if (!formData.image) {
      newErrors.image = "Please select a pet image."
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
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append("name", formData.name)
      submitData.append("species", formData.species)
      submitData.append("breed", formData.breed)
      submitData.append("birthdate", formData.birthdate!.toISOString().split("T")[0]) // Format as YYYY-MM-DD
      submitData.append("residence", formData.residence)
      submitData.append("gender", formData.gender)
      submitData.append("color", formData.color)
      if (formData.image) {
        submitData.append("image", formData.image)
      }

      // Make authenticated request to create pet
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_UNO}/pets/create`, {
        method: "POST",
        body: submitData,
      })

      const data: ApiErrorResponse | ApiSuccessResponse = await response.json()

      if (response.ok) {
        setSuccess(true)

        // Show success message and redirect to home after 1 second
        setTimeout(() => {
          window.location.href = "/pets"
        }, 1000)
      } else {
        const errorData = data as ApiErrorResponse

        if (errorData.details && Array.isArray(errorData.details)) {
          // Handle validation errors from backend
          const newErrors: Record<string, string> = {}
          errorData.details.forEach((error: ValidationError) => {
            newErrors[error.path] = error.msg
          })
          setErrors(newErrors)
        } else {
          // Handle general errors
          setGeneralError(errorData.message || errorData.error || "Failed to create pet profile. Please try again.")
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
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center max-w-md">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h1 className="text-xl font-semibold text-white mb-2">Pet profile created successfully!</h1>
          <p className="text-[#8b949e] text-sm mb-6">Your pet has been added to PetHub. Redirecting to home...</p>
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-[#8b949e]" />
          </div>
        </div>
      </div>
    )
  }

  // Custom styles for react-select to match GitHub theme
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: "#0d1117",
      borderColor: errors.species || errors.breed || errors.residence ? "#f85149" : "#30363d",
      borderWidth: "1px",
      borderRadius: "6px",
      minHeight: "40px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(31, 111, 235, 0.3)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#1f6feb" : "#30363d",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "6px",
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#1f6feb" : state.isFocused ? "#21262d" : "transparent",
      color: "#ffffff",
      "&:hover": {
        backgroundColor: "#21262d",
      },
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

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <Header userInfo={userInfo} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {generalError && (
                  <div className="bg-[#da3633] bg-opacity-15 border border-[#f85149] rounded-md p-3 text-sm">
                    <div className="flex items-center gap-2 text-[#f85149]">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{generalError}</span>
                    </div>
                  </div>
                )}

                {/* Pet Name */}
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium text-[#f0f6fc] mb-2">
                    Pet name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your pet's name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 bg-[#0d1117] border rounded-md text-white placeholder-[#8b949e] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] ${
                      errors.name ? "border-[#f85149]" : "border-[#30363d]"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                  <p className="text-xs text-[#8b949e] mt-1">
                    Great pet names are short and memorable. Need inspiration? How about Buddy, Luna, or Max?
                  </p>
                </div>

                {/* Species */}
                <div>
                  <Label className="block text-sm font-medium text-[#f0f6fc] mb-2">Species *</Label>
                  <Select
                    options={SPECIES_OPTIONS}
                    value={selectedSpecies}
                    onChange={handleSpeciesChange}
                    placeholder="Select pet species"
                    styles={selectStyles}
                    isSearchable
                  />
                  {errors.species && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.species}
                    </p>
                  )}
                </div>

                {/* Breed */}
                <div>
                  <Label className="block text-sm font-medium text-[#f0f6fc] mb-2">Breed *</Label>
                  <Select
                    options={availableBreeds}
                    value={selectedBreed}
                    onChange={handleBreedChange}
                    placeholder={selectedSpecies ? "Select breed" : "Select species first"}
                    styles={selectStyles}
                    isSearchable
                    isDisabled={!selectedSpecies}
                  />
                  {errors.breed && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.breed}
                    </p>
                  )}
                  <p className="text-xs text-[#8b949e] mt-1">
                    {selectedSpecies
                      ? `Choose from ${availableBreeds.length} available ${selectedSpecies.label.toLowerCase()} breeds`
                      : "Select a species to see available breeds"}
                  </p>
                </div>

                {/* Birthdate */}
                <div>
                  <Label className="block text-sm font-medium text-[#f0f6fc] mb-2">Birthdate *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-[#0d1117] border text-white hover:bg-[#21262d]",
                          !formData.birthdate && "text-[#8b949e]",
                          errors.birthdate ? "border-[#f85149]" : "border-[#30363d]",
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
                  {errors.birthdate && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.birthdate}
                    </p>
                  )}
                </div>

                {/* Residence */}
                <div className="space-y-4">
                  <Label className="block text-sm font-medium text-[#f0f6fc] mb-2">Residence *</Label>

                  {/* Country */}
                  <div>
                    <Label className="block text-xs font-medium text-[#8b949e] mb-1">Country</Label>
                    <Select
                      options={countryOptions}
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      placeholder="Select country"
                      styles={selectStyles}
                      isSearchable
                    />
                  </div>

                  {/* State (if available) */}
                  {availableStates.length > 0 && (
                    <div>
                      <Label className="block text-xs font-medium text-[#8b949e] mb-1">State/Province</Label>
                      <Select
                        options={availableStates}
                        value={selectedState}
                        onChange={handleStateChange}
                        placeholder="Select state/province"
                        styles={selectStyles}
                        isSearchable
                        isDisabled={!selectedCountry}
                      />
                    </div>
                  )}

                  {/* City */}
                  {availableCities.length > 0 && (
                    <div>
                      <Label className="block text-xs font-medium text-[#8b949e] mb-1">City</Label>
                      <Select
                        options={availableCities}
                        value={selectedCity}
                        onChange={handleCityChange}
                        placeholder="Select city"
                        styles={selectStyles}
                        isSearchable
                        isDisabled={!selectedCountry}
                      />
                    </div>
                  )}

                  {errors.residence && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.residence}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <Label className="block text-sm font-medium text-[#f0f6fc] mb-2">Gender *</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === "male"}
                        onChange={handleInputChange}
                        className="text-[#238636]"
                      />
                      <span className="text-sm text-white">Male</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === "female"}
                        onChange={handleInputChange}
                        className="text-[#238636]"
                      />
                      <span className="text-sm text-white">Female</span>
                    </label>
                  </div>
                  {errors.gender && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <Label htmlFor="color" className="block text-sm font-medium text-[#f0f6fc] mb-2">
                    Color *
                  </Label>
                  <Input
                    id="color"
                    name="color"
                    type="text"
                    placeholder="e.g., Black, White, Brown, Golden"
                    value={formData.color}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-[#0d1117] border rounded-md text-white placeholder-[#8b949e] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] ${
                      errors.color ? "border-[#f85149]" : "border-[#30363d]"
                    }`}
                  />
                  {errors.color && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.color}
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <Label className="block text-sm font-medium text-[#f0f6fc] mb-2">Pet photo *</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      errors.image ? "border-[#f85149]" : "border-[#30363d]"
                    }`}
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Pet preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                        />
                        <div>
                          <p className="text-sm text-white mb-2">Photo selected successfully!</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("image-upload")?.click()}
                            className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
                          >
                            Change photo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 text-[#8b949e] mx-auto mb-3" />
                        <p className="text-sm text-[#8b949e] mb-2">Click to upload or drag and drop</p>
                        <p className="text-xs text-[#6e7681] mb-3">PNG, JPG, GIF up to 5MB</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("image-upload")?.click()}
                          className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] bg-transparent"
                        >
                          Choose file
                        </Button>
                      </div>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  {errors.image && (
                    <p className="text-sm text-[#f85149] mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.image}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating profile...
                      </>
                    ) : (
                      "Create pet profile"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => (window.location.href = "/pets")}
                    className="border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">💡 Tips for great pet profiles</h3>
              <ul className="text-xs text-[#8b949e] space-y-2">
                <li>• Use a clear, high-quality photo as the main image</li>
                <li>• Choose the correct species and breed for better matching</li>
                <li>• Provide accurate birthdate for age calculation</li>
                <li>• Include your city for local pet community connections</li>
                <li>• All fields are required for a complete profile</li>
              </ul>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">📋 Required Information</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.name ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Pet name</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.species ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Species</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.breed ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Breed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.birthdate ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Birthdate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.residence ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Residence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.gender ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Gender</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.color ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Color</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.image ? "bg-green-500" : "bg-[#30363d]"}`}></div>
                  <span className="text-[#8b949e]">Photo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
