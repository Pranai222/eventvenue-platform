// Admin API calls

import { apiClient } from "./client"
import type { User, Vendor } from "@/lib/types/auth"
import type { Booking, Review } from "@/lib/types/booking"

export interface SystemStats {
  totalUsers: number
  totalVendors: number
  totalBookings: number
  totalRevenue: number
  pendingVendors: number
  activeBookings: number
}

export interface ConversionRate {
  pointsPerDollar: number
}

export interface PlatformFees {
  userPlatformFeePoints: number
  venueCreationPoints: number
  eventCreationPointsQuantity: number
  eventCreationPointsSeat: number
}

export interface VendorData {
  id?: number
  email: string
  businessName: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  isVerified: boolean
  createdAt?: string
}

export interface AdminStats {
  totalUsers: number
  totalVendors: number
  totalBookings: number
  pendingVendors: number
}

export const adminApi = {
  // Dashboard stats
  getStats: () => apiClient.get<SystemStats>("/api/admin/stats"),

  // User management
  getAllUsers: () => apiClient.get<User[]>("/api/admin/users"),
  updateUser: (id: number, data: Partial<User>) => apiClient.put<User>(`/api/admin/users/${id}`, data),
  deleteUser: (id: number) => apiClient.delete(`/api/admin/users/${id}`),
  adjustUserPoints: (userId: number, pointsChange: number, reason: string) =>
    apiClient.put(`/api/admin/users/${userId}/points`, { pointsChange, reason }),

  // Vendor management
  getAllVendors: () => apiClient.get<Vendor[]>("/api/admin/vendors"),
  getPendingVendors: () =>
    apiClient.get<{ success: boolean; message: string; data: VendorData[] }>("/api/admin/vendors/pending"),
  approveVendor: (vendorId: number) =>
    apiClient.put<{ success: boolean; message: string; data: VendorData }>(`/api/admin/vendors/${vendorId}/approve`),
  rejectVendor: (vendorId: number, reason: string) =>
    apiClient.put<{ success: boolean; message: string; data: VendorData }>(
      `/api/admin/vendors/${vendorId}/reject?reason=${encodeURIComponent(reason)}`,
    ),
  deleteVendor: (id: number) => apiClient.delete(`/api/admin/vendors/${id}`),

  // Booking management
  getAllBookings: () => apiClient.get<{ success: boolean; message: string; data: Booking[] }>("/api/admin/bookings"),
  getBookingById: (id: number) =>
    apiClient.get<{ success: boolean; message: string; data: Booking }>(`/api/admin/bookings/${id}`),

  // Review moderation
  getAllReviews: () => apiClient.get<Review[]>("/api/admin/reviews"),
  approveReview: (id: number) => apiClient.put<Review>(`/api/admin/reviews/${id}/approve`, {}),
  rejectReview: (id: number) => apiClient.put<Review>(`/api/admin/reviews/${id}/reject`, {}),

  // Points system
  getConversionRate: () => apiClient.get<ConversionRate>("/api/admin/settings/conversion-rate"),
  updateConversionRate: (pointsPerDollar: number) =>
    apiClient.put<ConversionRate>("/api/admin/settings/conversion-rate", { pointsPerDollar }),

  // Platform fees
  getPlatformFees: () => apiClient.get<PlatformFees>("/api/admin/settings/platform-fees"),
  updatePlatformFees: (fees: PlatformFees) =>
    apiClient.put<PlatformFees>("/api/admin/settings/platform-fees", fees),

  // Audit logs
  getAuditLogs: () => apiClient.get<{ success: boolean; data: AuditLog[] }>("/api/admin/audit-logs"),
  getAuditLogsByEntityType: (entityType: string) =>
    apiClient.get<{ success: boolean; data: AuditLog[] }>(`/api/admin/audit-logs/entity/${entityType}`),
  getAuditLogsByAction: (action: string) =>
    apiClient.get<{ success: boolean; data: AuditLog[] }>(`/api/admin/audit-logs/action/${action}`),
}

export interface AuditLog {
  id: number
  action: string
  entityType: string
  entityId: number | null
  description: string
  performedBy: string
  userRole: string
  ipAddress: string | null
  createdAt: string
}

