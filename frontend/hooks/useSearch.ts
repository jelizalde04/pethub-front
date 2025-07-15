"use client"

import { useMemo } from 'react'

interface UseSearchProps<T> {
  data: T[]
  searchFields: string[]
  searchQuery: string
}

export function useSearch<T extends Record<string, any>>({
  data,
  searchFields,
  searchQuery
}: UseSearchProps<T>) {
  
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data
    }

    const query = searchQuery.toLowerCase().trim()
    
    return data.filter((item) => {
      return searchFields.some((field) => {
        // Manejar campos anidados (ej: 'pet.name')
        const value = getNestedValue(item, field)
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query)
        }
        if (typeof value === 'number') {
          return value.toString().includes(query)
        }
        if (Array.isArray(value)) {
          return value.some((val: any) => 
            typeof val === 'string' ? val.toLowerCase().includes(query) : false
          )
        }
        return false
      })
    })
  }, [data, searchFields, searchQuery])

  return {
    filteredData,
    hasResults: filteredData.length > 0,
    totalResults: filteredData.length
  }
}

// Función auxiliar para obtener valores anidados
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}