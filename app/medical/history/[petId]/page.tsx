"use client"

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
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { makeAuthenticatedRequest } from "@/utils/auth"
import { Header } from "@/components/header"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"

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

export default function MedicalHistoryPage() {
  const params = useParams()
  const petId = params.petId as string

  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; recordId: string | null }>({
    isOpen: false,
    recordId: null,
  })

  useEffect(() => {
    if (petId) {
      loadMedicalHistory()
    }
  }, [petId])

  const loadMedicalHistory = async () => {
    try {
      setIsLoading(true)
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_BASE_URL_DOS}/medical/${petId}`)

      if (response.ok) {
        const data = await response.json()
        // Sort records by creation date (newest first)
        const sortedRecords = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          : []
        setRecords(sortedRecords)
      } else {
        console.error("Error loading medical history")
        setRecords([])
      }
    } catch (error) {
      console.error("Error loading medical history:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRecord = (recordId: string) => {
    setDeleteModal({ isOpen: true, recordId })
  }

  const confirmDeleteRecord = async () => {
    if (!deleteModal.recordId) return

    try {
      const response = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_MEDICAL_API_URL_CINCO}/medical/delete/${deleteModal.recordId}`,
        {
          method: "DELETE",
        },
      )

      if (response.ok) {
        setRecords((prev) => prev.filter((record) => record.id !== deleteModal.recordId))
        setDeleteModal({ isOpen: false, recordId: null })

        // Show success message
        const successDiv = document.createElement("div")
        successDiv.className = "fixed top-4 right-4 bg-[#238636] text-white px-4 py-2 rounded-lg z-50"
        successDiv.textContent = "Medical record deleted successfully!"
        document.body.appendChild(successDiv)

        setTimeout(() => {
          document.body.removeChild(successDiv)
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(`Error deleting record: ${errorData.message || "Please try again."}`)
      }
    } catch (error) {
      console.error("Error deleting record:", error)
      alert("Network error. Please check your connection and try again.")
    }
  }

  const handleBack = () => {
    window.location.href = `/pet/${petId}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
            <p className="text-[#8b949e]">Loading medical history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleBack} className="text-[#8b949e] hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Medical History</h1>
            <p className="text-[#8b949e]">Complete medical record history for this pet</p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-16 w-16 text-[#30363d] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Medical Records</h2>
            <p className="text-[#8b949e] mb-6">No medical history found for this pet.</p>
            <Button onClick={handleBack} className="bg-[#238636] hover:bg-[#2ea043] text-white">
              Go Back
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {records.map((record, index) => (
              <div key={record.id} className="relative">
                {/* Timeline connector */}
                {index < records.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-full bg-[#30363d] z-0"></div>
                )}

                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-2 top-6 w-4 h-4 bg-[#58a6ff] rounded-full border-2 border-[#0d1117] z-10"></div>

                  {/* Record Header */}
                  <div className="flex items-center justify-between mb-4 ml-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Medical Record #{records.length - index}</h3>
                      <p className="text-[#8b949e] text-sm">Created on {formatDateTime(record.createdAt)}</p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#8b949e] hover:text-white hover:bg-[#30363d]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#161b22] border-[#30363d] text-white">
                        <DropdownMenuItem
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-[#f85149] hover:bg-[#da3633] hover:bg-opacity-15 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Record Details */}
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                        <Calendar className="h-4 w-4 text-[#58a6ff]" />
                        <div>
                          <p className="text-[#8b949e] text-sm">Last Visit</p>
                          <p className="text-white font-medium">{formatDate(record.lastVisitDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                        <Weight className="h-4 w-4 text-[#58a6ff]" />
                        <div>
                          <p className="text-[#8b949e] text-sm">Weight</p>
                          <p className="text-white font-medium">{record.weight} kg</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                        <Shield className="h-4 w-4 text-[#58a6ff]" />
                        <div>
                          <p className="text-[#8b949e] text-sm">Sterilized</p>
                          <p className={`font-medium ${record.sterilized ? "text-[#2ea043]" : "text-[#f85149]"}`}>
                            {record.sterilized ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-[#21262d] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-[#58a6ff]" />
                          <p className="text-[#8b949e] text-sm">Health Status</p>
                        </div>
                        <p className="text-white text-sm">{record.healthStatus}</p>
                      </div>

                      {record.diseases && (
                        <div className="p-3 bg-[#21262d] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="h-4 w-4 text-[#f85149]" />
                            <p className="text-[#8b949e] text-sm">Diseases</p>
                          </div>
                          <p className="text-white text-sm">{record.diseases}</p>
                        </div>
                      )}

                      {record.treatments && (
                        <div className="p-3 bg-[#21262d] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Pill className="h-4 w-4 text-[#58a6ff]" />
                            <p className="text-[#8b949e] text-sm">Treatments</p>
                          </div>
                          <p className="text-white text-sm">{record.treatments}</p>
                        </div>
                      )}
                    </div>

                    {/* Full width sections */}
                    {record.vaccinations && (
                      <div className="md:col-span-2 p-3 bg-[#21262d] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-[#2ea043]" />
                          <p className="text-[#8b949e] text-sm">Vaccinations</p>
                        </div>
                        <p className="text-white text-sm">{record.vaccinations}</p>
                      </div>
                    )}

                    {record.allergies && (
                      <div className="md:col-span-2 p-3 bg-[#21262d] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-[#f85149]" />
                          <p className="text-[#8b949e] text-sm">Allergies</p>
                        </div>
                        <p className="text-white text-sm">{record.allergies}</p>
                      </div>
                    )}

                    {record.specialCare && (
                      <div className="md:col-span-2 p-3 bg-[#21262d] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-[#f85149]" />
                          <p className="text-[#8b949e] text-sm">Special Care</p>
                        </div>
                        <p className="text-white text-sm">{record.specialCare}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Medical Record"
        message="Are you sure you want to delete this medical record? This action cannot be undone and all data will be permanently lost."
        confirmText="Delete Record"
        onConfirm={confirmDeleteRecord}
        onCancel={() => setDeleteModal({ isOpen: false, recordId: null })}
      />
    </div>
  )
}
