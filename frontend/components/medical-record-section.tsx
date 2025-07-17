"use client"

import { useState, useEffect } from "react"
import { Calendar, Weight, Heart, Shield, Pill, AlertTriangle, Stethoscope, Plus, Edit, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { makeAuthenticatedRequest } from "@/utils/auth"

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

interface MedicalRecordSectionProps {
  petId: string
  isOwner: boolean
}

export function MedicalRecordSection({ petId, isOwner }: MedicalRecordSectionProps) {
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasRecords, setHasRecords] = useState(false)

  useEffect(() => {
    if (petId) {
      loadMedicalRecord()
    }
  }, [petId])

  const loadMedicalRecord = async () => {
    try {
      setIsLoading(true)

      // First check if any records exist
      const allRecordsResponse = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_DOS}/medical/${petId}`,
      )

      if (allRecordsResponse.ok) {
        const allRecords = await allRecordsResponse.json()
        setHasRecords(Array.isArray(allRecords) && allRecords.length > 0)

        if (allRecords.length > 0) {
          // Get the latest record
          const latestResponse = await makeAuthenticatedRequest(
            `${process.env.NEXT_PUBLIC_MEDICAL_API_URL_TRES}/medical/lastest/${petId}`,
          )

          if (latestResponse.ok) {
            const latestRecord = await latestResponse.json()
            setMedicalRecord(latestRecord)
          }
        }
      } else {
        setHasRecords(false)
        setMedicalRecord(null)
      }
    } catch (error) {
      console.error("Error loading medical record:", error)
      setHasRecords(false)
      setMedicalRecord(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRecord = () => {
    window.location.href = `/medical/create/${petId}`
  }

  const handleUpdateRecord = () => {
    window.location.href = `/medical/update/${petId}`
  }

  const handleViewHistory = () => {
    window.location.href = `/medical/history/${petId}`
  }

  if (isLoading) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Medical Record</h3>
        <div className="text-center py-4">
          <div className="animate-pulse text-[#8b949e]">Loading medical record...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Medical Record</h3>
        {isOwner && (
          <div className="flex gap-2">
            {hasRecords && (
              <Button
                onClick={handleViewHistory}
                size="sm"
                className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white p-2"
                title="View History"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={hasRecords ? handleUpdateRecord : handleCreateRecord}
              size="sm"
              className={
                hasRecords
                  ? "bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white p-2"
                  : "bg-[#238636] hover:bg-[#2ea043] text-white"
              }
              title={hasRecords ? "Update Record" : "Create Record"}
            >
              {hasRecords ? (
                <Edit className="h-4 w-4" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Record
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {medicalRecord ? (
        <div className="space-y-4">
          {/* Main Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-[#21262d] rounded-lg">
              <Calendar className="h-5 w-5 text-[#58a6ff] mx-auto mb-1" />
              <p className="text-[#8b949e] text-xs">Last Visit</p>
              <p className="text-white font-medium text-sm">
                {new Date(medicalRecord.lastVisitDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="text-center p-3 bg-[#21262d] rounded-lg">
              <Weight className="h-5 w-5 text-[#58a6ff] mx-auto mb-1" />
              <p className="text-[#8b949e] text-xs">Weight</p>
              <p className="text-white font-medium text-sm">{medicalRecord.weight} kg</p>
            </div>

            <div className="text-center p-3 bg-[#21262d] rounded-lg">
              <Shield className="h-5 w-5 text-[#58a6ff] mx-auto mb-1" />
              <p className="text-[#8b949e] text-xs">Sterilized</p>
              <p className={`font-medium text-sm ${medicalRecord.sterilized ? "text-[#2ea043]" : "text-[#f85149]"}`}>
                {medicalRecord.sterilized ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {/* Health Status */}
          <div className="p-3 bg-[#21262d] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-[#58a6ff]" />
              <p className="text-[#8b949e] text-sm font-medium">Health Status</p>
            </div>
            <p className="text-white text-sm leading-relaxed">{medicalRecord.healthStatus}</p>
          </div>

          {/* Medical Details Grid */}
          <div className="space-y-3">
            {medicalRecord.diseases && (
              <div className="p-3 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-[#f85149]" />
                  <p className="text-[#8b949e] text-sm font-medium">Diseases</p>
                </div>
                <p className="text-white text-sm leading-relaxed">{medicalRecord.diseases}</p>
              </div>
            )}

            {medicalRecord.treatments && (
              <div className="p-3 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="h-4 w-4 text-[#58a6ff]" />
                  <p className="text-[#8b949e] text-sm font-medium">Treatments</p>
                </div>
                <p className="text-white text-sm leading-relaxed">{medicalRecord.treatments}</p>
              </div>
            )}

            {medicalRecord.vaccinations && (
              <div className="p-3 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[#2ea043]" />
                  <p className="text-[#8b949e] text-sm font-medium">Vaccinations</p>
                </div>
                <p className="text-white text-sm leading-relaxed">{medicalRecord.vaccinations}</p>
              </div>
            )}

            {medicalRecord.allergies && (
              <div className="p-3 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-[#f85149]" />
                  <p className="text-[#8b949e] text-sm font-medium">Allergies</p>
                </div>
                <p className="text-white text-sm leading-relaxed">{medicalRecord.allergies}</p>
              </div>
            )}

            {medicalRecord.specialCare && (
              <div className="p-3 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-[#f85149]" />
                  <p className="text-[#8b949e] text-sm font-medium">Special Care</p>
                </div>
                <p className="text-white text-sm leading-relaxed">{medicalRecord.specialCare}</p>
              </div>
            )}
          </div>

          {/* Record Date */}
          <div className="text-center pt-2 border-t border-[#30363d]">
            <p className="text-[#6e7681] text-xs">
              Last updated:{" "}
              {new Date(medicalRecord.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Stethoscope className="h-12 w-12 text-[#30363d] mx-auto mb-3" />
          <p className="text-[#8b949e] mb-2">No medical record found</p>
          <p className="text-[#6e7681] text-sm mb-4">
            {isOwner ? "Create a medical record to track health information." : "No medical information available."}
          </p>
        </div>
      )}
    </div>
  )
}
