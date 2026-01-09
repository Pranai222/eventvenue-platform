import { apiClient } from "./client"
import type { Booking } from "@/lib/types/booking"

export interface BookingData {
  id: number
  userId: number
  userName?: string
  venueId?: number
  eventId?: number
  bookingDate: string
  checkInTime?: string
  checkOutTime?: string
  durationHours?: number
  quantity?: number
  totalAmount: number
  pointsUsed: number
  status: string
  paymentStatus: string
  createdAt?: string
  updatedAt?: string
  // Seat info for seat-selection events
  seatLabels?: string
  seatCount?: number
}

export interface BookingCostResponse {
  subtotal: number
  pointsDiscount: number
  totalAmount: number
  pointsUsed: number
}

const convertToBooking = (data: BookingData): Booking => ({
  id: data.id,
  userId: data.userId,
  userName: data.userName,
  venueId: data.venueId,
  eventId: data.eventId,
  bookingDate: data.bookingDate,
  startDate: data.bookingDate,
  endDate: data.bookingDate,
  checkInTime: data.checkInTime,
  checkOutTime: data.checkOutTime,
  durationHours: data.durationHours,
  quantity: data.quantity,
  totalAmount: data.totalAmount,
  pointsUsed: data.pointsUsed,
  status: data.status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
  paymentStatus: data.paymentStatus,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt,
  // Include seat info for seat-selection events
  seatLabels: data.seatLabels,
  seatCount: data.seatCount,
})

const convertToBookingData = (data: any): Partial<BookingData> => {
  const bookingData: Partial<BookingData> = {
    venueId: data.venueId,
    eventId: data.eventId,
    bookingDate: data.startDate || data.bookingDate,
    totalAmount: data.totalAmount || 0,
    pointsUsed: data.pointsUsed || 0,
    status: data.status || "PENDING",
    paymentStatus: data.paymentStatus || "PENDING",
  }

  if (data.checkInTime && data.checkOutTime) {
    bookingData.checkInTime = data.checkInTime
    bookingData.checkOutTime = data.checkOutTime

    const checkIn = new Date(`2000-01-01 ${data.checkInTime}`)
    const checkOut = new Date(`2000-01-01 ${data.checkOutTime}`)
    bookingData.durationHours = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60))
  } else if (data.durationHours) {
    bookingData.durationHours = data.durationHours
  }

  return bookingData
}

export const bookingsApi = {
  calculateCost: async (params: {
    venueId?: number
    eventId?: number
    durationHours?: number
    quantity?: number
    pointsToUse?: number
  }): Promise<BookingCostResponse> => {
    const queryParams = new URLSearchParams()
    if (params.venueId) queryParams.append("venueId", params.venueId.toString())
    if (params.eventId) queryParams.append("eventId", params.eventId.toString())
    if (params.durationHours) queryParams.append("durationHours", params.durationHours.toString())
    if (params.quantity) queryParams.append("quantity", params.quantity.toString())
    if (params.pointsToUse) queryParams.append("pointsToUse", params.pointsToUse.toString())

    const url = `/api/bookings/calculate-cost?${queryParams.toString()}`
    const response = await apiClient.get<BookingCostResponse>(url)
    return response as BookingCostResponse
  },

  create: async (data: any) => {
    const bookingData = convertToBookingData(data)
    const response = await apiClient.post<BookingData>("/api/bookings", bookingData)
    return convertToBooking(response as BookingData)
  },

  confirm: async (id: number): Promise<Booking> => {
    const response = await apiClient.put<BookingData>(`/api/bookings/${id}/confirm`)
    return convertToBooking(response as BookingData)
  },

  getById: async (id: number) => {
    const response = await apiClient.get<BookingData>(`/api/bookings/${id}`)
    return convertToBooking(response as BookingData)
  },

  getUserBookings: async () => {
    const response = await apiClient.get<BookingData[]>("/api/bookings/my-bookings")
    const bookings = Array.isArray(response) ? response : [response]
    return bookings.map(convertToBooking)
  },

  getMyBookings: async () => {
    const response = await apiClient.get<BookingData[]>("/api/bookings/my-bookings")
    const bookings = Array.isArray(response) ? response : [response]
    return bookings.map(convertToBooking)
  },

  getVendorBookings: async () => {
    const response = await apiClient.get<BookingData[]>("/api/bookings/vendor/my-bookings")
    const bookings = Array.isArray(response) ? response : [response]
    return bookings.map(convertToBooking)
  },

  getAll: async () => {
    const response = await apiClient.get<BookingData[]>("/api/bookings")
    const bookings = Array.isArray(response) ? response : [response]
    return bookings.map(convertToBooking)
  },

  update: async (id: number, data: Partial<BookingData>) => {
    const response = await apiClient.put<BookingData>(`/api/bookings/${id}`, data)
    return convertToBooking(response as BookingData)
  },

  cancel: async (id: number): Promise<{ success: boolean; data?: { refundAmount: number; refundPercentage: number; message: string } }> => {
    const response = await apiClient.put<any>(`/api/bookings/${id}/cancel`, {})
    return response
  },

  createWithPoints: async (data: any) => {
    const bookingData = convertToBookingData(data)
    const payload = {
      ...bookingData,
      pointsToUse: data.pointsToUse || 0,
      paypalTransactionId: data.paypalTransactionId || null,
      remainingAmount: data.remainingAmount || 0
    }
    const response = await apiClient.post<BookingData>("/api/bookings/with-points", payload)
    return convertToBooking(response as BookingData)
  },
}
