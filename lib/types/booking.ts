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
  // Vendor business info from DTO
  vendorBusinessName?: string
  vendorBusinessPhone?: string
  vendorEmail?: string
}

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
  totalAmount: number
  pointsUsed: number
  status: string
  paymentStatus: string
  createdAt?: string
  updatedAt?: string
}

export interface Venue {
  id: number
  vendorId: number
  name: string
  description: string
  category?: string // Backend field for venue type filtering
  location: string // Maps to city + address from backend
  city: string
  address: string
  capacity: number
  pricePerDay: number // Maps to pricePerHour * 8 hours
  pricePerHour: number
  amenities: string[]
  images: string[]
  availability: boolean // Maps to isAvailable
  isAvailable: boolean
  featured: boolean
  rating: number
  reviewCount: number // Maps to totalBookings for now
  totalBookings: number
  vendorPhone: string
  editCount?: number
  isEditLocked?: boolean
  // Vendor business info from DTO
  vendorBusinessName?: string
  vendorBusinessPhone?: string
  vendorEmail?: string
}

export interface Event {
  id: number
  vendorId: number
  name: string
  description: string
  category: string
  date: string // Maps to eventDate from backend
  eventDate: string // Backend field name
  time: string // Maps to eventTime from backend
  eventTime: string // Backend field name
  location: string
  capacity: number // Maps to maxAttendees from backend
  maxAttendees: number // Backend field name
  pricePerTicket: number
  totalTickets: number
  ticketsAvailable: number
  bookingType?: 'QUANTITY' | 'SEAT_SELECTION' // Booking mode
  status: "DRAFT" | "PUBLISHED" // Derived from isActive
  isActive: boolean // Backend field name
  featured?: boolean // Frontend only flag
  rating?: number // Average rating from reviews
  reviewCount?: number // Number of reviews
  images: string[] // Frontend converts from backend string
  ticketTypes: TicketType[] // Frontend only - for display purposes
  vendorPhone: string
  editCount?: number
  isEditLocked?: boolean
  createdAt?: string
  updatedAt?: string
  // Vendor business info from DTO
  vendorBusinessName?: string
  vendorBusinessPhone?: string
  vendorEmail?: string
}

export interface TicketType {
  id: number
  name: string
  price: number
  quantity: number
  availableQuantity: number
}

export interface Booking {
  id: number
  userId: number
  userName?: string // Stored at booking time
  userEmail?: string
  venueId?: number
  eventId?: number
  bookingDate: string // LocalDate from backend
  startDate: string // For display - derived from bookingDate
  endDate?: string // For display - calculated
  checkInTime?: string
  checkOutTime?: string
  durationHours?: number
  quantity?: number // For event tickets
  totalAmount: number
  pointsUsed: number
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  paymentStatus?: string
  createdAt?: string
  updatedAt?: string
  // Seat info for seat-selection events
  seatLabels?: string    // e.g., "A1, A2, B3"
  seatCount?: number     // Number of seats booked
}

export interface Review {
  id: number
  userId: number
  venueId?: number
  eventId?: number
  rating: number
  comment: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
}

// Seat-based booking types
export interface SeatCategory {
  id: number
  eventId: number
  name: string
  price: number
  color: string
  rows: string[]
  seatsPerRow: number
  aisleAfter: number[]
  sortOrder: number
}

export interface EventSeat {
  id: number
  eventId: number
  categoryId: number
  rowLabel: string
  seatNumber: number
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'
  price: number
  bookingId?: number
}

export interface SeatLayout {
  categories: SeatCategory[]
  seats: EventSeat[]
}

