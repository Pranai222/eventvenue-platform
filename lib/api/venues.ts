import { apiClient } from "./client"
import type { Venue } from "@/lib/types/booking"

export interface VenueData {
  id: number
  vendorId: number
  name: string
  description: string
  category: string
  city: string
  address: string
  capacity: number
  pricePerHour: number
  amenities?: string
  images?: string
  isAvailable: boolean
  rating: number
  totalBookings: number
  vendorPhone: string
  editCount?: number
  isEditLocked?: boolean
  createdAt?: string
  updatedAt?: string
  vendorBusinessName?: string
  vendorBusinessPhone?: string
  vendorEmail?: string
}

const convertToVenue = (data: VenueData): Venue => ({
  id: data.id,
  vendorId: data.vendorId,
  name: data.name,
  description: data.description,
  location: `${data.city}, ${data.address}`,
  city: data.city,
  address: data.address,
  capacity: data.capacity,
  pricePerDay: data.pricePerHour * 8,
  pricePerHour: data.pricePerHour,
  amenities: data.amenities ? data.amenities.split(",").map((a) => a.trim()) : [],
  images: data.images ? data.images.split(",").map((i) => i.trim()) : [],
  availability: data.isAvailable,
  isAvailable: data.isAvailable,
  featured: data.rating >= 4.5,
  rating: data.rating,
  reviewCount: data.totalBookings,
  totalBookings: data.totalBookings,
  vendorPhone: data.vendorPhone || '',
  editCount: data.editCount,
  isEditLocked: data.isEditLocked,
  vendorBusinessName: data.vendorBusinessName,
  vendorBusinessPhone: data.vendorBusinessPhone,
  vendorEmail: data.vendorEmail,
})

export const venuesApi = {
  getAll: async (params?: any) => {
    const response = await apiClient.get<VenueData[]>(
      `/api/venues${params ? `?${new URLSearchParams(params).toString()}` : ""}`,
    )
    const venues = Array.isArray(response) ? response : [response].filter(Boolean)
    return venues.map(convertToVenue)
  },

  getById: async (id: number) => {
    const response = await apiClient.get<VenueData>(`/api/venues/${id}`)
    return convertToVenue(response as VenueData)
  },

  getByCity: async (city: string) => {
    const response = await apiClient.get<VenueData[]>(`/api/venues/city/${city}`)
    const venues = Array.isArray(response) ? response : [response].filter(Boolean)
    return venues.map(convertToVenue)
  },

  create: async (data: Omit<VenueData, "id" | "vendorId">) => {
    const response = await apiClient.post<VenueData>("/api/venues", data)
    return convertToVenue(response as VenueData)
  },

  update: async (id: number, data: Partial<VenueData>) => {
    const response = await apiClient.put<VenueData>(`/api/venues/${id}`, data)
    return convertToVenue(response as VenueData)
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/venues/${id}`)
    return response
  },

  getMyVenues: async () => {
    const response = await apiClient.get<VenueData[]>("/api/venues/vendor/my-venues")
    const venues = Array.isArray(response) ? response : [response].filter(Boolean)
    return venues.map(convertToVenue)
  },

  getVendorVenues: async () => {
    const response = await apiClient.get<VenueData[]>("/api/venues/vendor/my-venues")
    const venues = Array.isArray(response) ? response : [response].filter(Boolean)
    return venues.map(convertToVenue)
  },

  search: async (query: string) => {
    const response = await apiClient.get<VenueData[]>(`/api/venues/search?q=${encodeURIComponent(query)}`)
    const venues = Array.isArray(response) ? response : [response].filter(Boolean)
    return venues.map(convertToVenue)
  },

  filter: async (filters: {
    city?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    capacity?: number
    rating?: number
  }) => {
    const params = new URLSearchParams()
    if (filters.city) params.append("city", filters.city)
    if (filters.category) params.append("category", filters.category)
    if (filters.minPrice) params.append("minPrice", filters.minPrice.toString())
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString())
    if (filters.capacity) params.append("capacity", filters.capacity.toString())
    if (filters.rating) params.append("rating", filters.rating.toString())

    const response = await apiClient.get<VenueData[]>(`/api/venues/filter?${params.toString()}`)
    const venues = Array.isArray(response) ? response : [response].filter(Boolean)
    return venues.map(convertToVenue)
  },

  getFeatured: async () => {
    const response = await apiClient.get<VenueData[]>("/api/venues/featured")
    const venues = Array.isArray(response) ? response : [response].filter(Boolean)
    return venues.map(convertToVenue)
  },

  checkAvailability: async (venueId: number, startDate: string, endDate: string) => {
    try {
      // Call backend API to check actual booking availability
      // The backend checks if venue is published and if it's generally available
      const response = await apiClient.get<{ available: boolean }>(
        `/api/venues/${venueId}/check-availability?date=${startDate}`
      )
      return { available: response.available }
    } catch (error) {
      console.error("[EventVenue] Failed to check availability:", error)
      return { available: false }
    }
  },


  publish: async (id: number) => {
    const response = await apiClient.put<VenueData>(`/api/venues/${id}/publish`, {})
    return convertToVenue(response as VenueData)
  },

  unpublish: async (id: number) => {
    const response = await apiClient.put<VenueData>(`/api/venues/${id}/unpublish`, {})
    return convertToVenue(response as VenueData)
  },
}
