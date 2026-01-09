import { apiClient } from "./client"
import type { Event } from "@/lib/types/booking"

// Helper function to parse images from backend
const parseEventImages = (event: any): string[] => {
  if (!event.images) return []
  if (typeof event.images === 'string') {
    return event.images.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
  }
  if (Array.isArray(event.images)) return event.images
  return []
}

export const eventsApi = {
  getAll: async () => {
    const response = await apiClient.get<any[]>("/api/events")
    const eventList = Array.isArray(response) ? response : [response].filter(Boolean)
    return eventList.map(event => ({
      ...event,
      images: parseEventImages(event)
    }))
  },

  getActive: async () => {
    const response = await apiClient.get<any[]>("/api/events/active")
    const eventList = Array.isArray(response) ? response : [response].filter(Boolean)
    return eventList.map(event => ({
      ...event,
      images: parseEventImages(event)
    }))
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Event & { images?: string | string[] }>(`/api/events/${id}`)

    // Parse images - backend returns comma-separated string or null
    let imageArray: string[] = []
    if (response.images) {
      if (typeof response.images === 'string') {
        imageArray = response.images.split(',').map(s => s.trim()).filter(s => s.length > 0)
      } else if (Array.isArray(response.images)) {
        imageArray = response.images
      }
    }

    return {
      ...response,
      date: response.eventDate,
      time: response.eventTime,
      capacity: response.maxAttendees,
      status: response.isActive ? ("PUBLISHED" as const) : ("DRAFT" as const),
      images: imageArray,
      ticketTypes: [
        {
          id: 1,
          name: "General Admission",
          price: response.pricePerTicket,
          quantity: response.totalTickets,
          availableQuantity: response.ticketsAvailable,
        },
      ],
    }
  },

  create: async (data: Omit<Event, "id">) => {
    const response = await apiClient.post<Event>("/api/events", data)
    return response
  },

  update: async (id: number, data: Partial<Event>) => {
    // Convert images array to comma-separated string for backend
    const backendData = {
      ...data,
      images: Array.isArray(data.images) ? data.images.join(',') : data.images
    }
    const response = await apiClient.put<Event>(`/api/events/${id}`, backendData)
    return response
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/events/${id}`)
    return response
  },

  search: async (query: string) => {
    const response = await apiClient.get<Event[]>(`/api/events/search?q=${encodeURIComponent(query)}`)
    return Array.isArray(response) ? response : [response].filter(Boolean)
  },

  filter: async (filters: {
    category?: string
    city?: string
    minPrice?: number
    maxPrice?: number
    dateFrom?: string
    dateTo?: string
  }) => {
    const params = new URLSearchParams()
    if (filters.category) params.append("category", filters.category)
    if (filters.city) params.append("city", filters.city)
    if (filters.minPrice) params.append("minPrice", filters.minPrice.toString())
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString())
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.append("dateTo", filters.dateTo)

    const response = await apiClient.get<Event[]>(`/api/events/filter?${params.toString()}`)
    return Array.isArray(response) ? response : [response].filter(Boolean)
  },

  getVendorEvents: async () => {
    try {
      const response = await apiClient.get<(Event & { images?: string | string[] })[]>("/api/events/vendor/my-events")
      const eventList = Array.isArray(response) ? response : [response].filter(Boolean)
      return eventList.map((event) => {
        // Parse images - backend returns comma-separated string or null
        let imageArray: string[] = []
        if (event.images) {
          if (typeof event.images === 'string') {
            imageArray = event.images.split(',').map(s => s.trim()).filter(s => s.length > 0)
          } else if (Array.isArray(event.images)) {
            imageArray = event.images
          }
        }

        return {
          ...event,
          date: event.eventDate,
          time: event.eventTime,
          capacity: event.maxAttendees,
          status: event.isActive ? ("PUBLISHED" as const) : ("DRAFT" as const),
          images: imageArray,
          ticketTypes: [],
        }
      })
    } catch (error) {
      console.error("[EventVenue] Failed to fetch vendor events:", error)
      return []
    }
  },

  publish: async (id: number) => {
    const response = await apiClient.put<Event>(`/api/events/${id}/publish`, {})
    return response
  },

  unpublish: async (id: number) => {
    const response = await apiClient.put<Event>(`/api/events/${id}/unpublish`, {})
    return response
  },

  // Seat-based booking methods
  getSeatLayout: async (eventId: number) => {
    const response = await apiClient.get<{
      categories: any[]
      seats: any[]
    }>(`/api/events/${eventId}/seats`)
    return response
  },

  configureSeatLayout: async (eventId: number, categories: any[]) => {
    const response = await apiClient.post(`/api/events/${eventId}/seats/configure`, categories)
    return response
  },

  bookSeats: async (eventId: number, seatIds: number[], pointsToUse: number = 0, paypalTransactionId?: string) => {
    const response = await apiClient.post<{
      success: boolean
      message: string
      bookingId?: number
      totalAmount?: number
      quantity?: number
    }>(`/api/events/${eventId}/seats/book`, {
      seatIds,
      pointsToUse,
      paypalTransactionId: paypalTransactionId || null
    })
    return response
  },
}

export const eventService = eventsApi
export default eventsApi

