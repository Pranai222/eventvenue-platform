const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

import { getToken, clearAuth, getUser } from "@/lib/auth"

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function extractResponseData<T>(response: any): T {
  if (!response) return response as T
  if (typeof response === "object" && response !== null) {
    if ("success" in response && "data" in response) {
      return response.data as T
    }
    return response as T
  }
  return response as T
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()

  console.log(`[API] Request: ${options.method || 'GET'} ${endpoint}`)
  console.log(`[API] Token present: ${!!token}`)
  if (token) {
    console.log(`[API] Token preview: ${token.substring(0, 30)}...`)
  }

  const publicEndpoints = [
    "/api/auth/user/login",
    "/api/auth/user/signup",
    "/api/auth/vendor/login",
    "/api/auth/vendor/signup",
    "/api/auth/admin/login",
    "/api/auth/verify-otp",
    "/api/auth/resend-otp",
    "/api/health",
    "/api/admin/settings/conversion-rate",
    "/api/admin/settings/platform-fees",
    "/api/credit-requests",
    "/api/withdrawals",
  ]
  const isPublicEndpoint = publicEndpoints.some((ep) => endpoint.includes(ep))

  if (!token && !isPublicEndpoint) {
    throw new ApiError("Authentication required", 401)
  }

  // Use explicit Record type to allow adding Authorization
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Merge any custom headers from options
  if (options.headers) {
    const optHeaders = options.headers as Record<string, string>
    Object.assign(headers, optHeaders)
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
    console.log(`[pranai API] Authorization header SET`)
  }

  const url = `${API_BASE_URL}${endpoint}`
  console.log(`[pranai API] Sending to: ${url}`)
  console.log(`[pranai API] Headers:`, Object.keys(headers))

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.log("[EventVenue] API Client - 401 Unauthorized")

        // Auto-logout and redirect for core auth endpoints only
        // Don't include events/bookings/venues as pages handle their own auth redirects
        const authEndpoints = [
          "/api/auth/",  // Auth endpoints
          "/api/vendor/profile",  // Vendor profile endpoint
          "/api/user/profile",    // User profile endpoint
        ]
        const publicExceptions = ["/api/admin/settings/conversion-rate"] // These admin endpoints are public

        const isAuthEndpoint = authEndpoints.some((ep: string) => endpoint.includes(ep))
        const isPublicException = publicExceptions.includes(endpoint)

        if (isAuthEndpoint && !isPublicException && typeof window !== "undefined") {
          console.log("[EventVenue] Auth endpoint failed with 401, clearing auth and redirecting")

          // Get current user role before clearing to redirect to correct login page
          let roleParam = "user"
          try {
            const currentUser = typeof window !== "undefined" ? getUser() : null
            roleParam = currentUser?.role === "VENDOR" ? "vendor" :
              currentUser?.role === "ADMIN" ? "admin" : "user"
          } catch (error) {
            console.log("[EventVenue] Could not get user for role redirect, using default")
          }

          clearAuth()
          window.location.href = `/login?role=${roleParam}`
        }
      }

      let errorData: any = {}
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { message: response.statusText }
        }
      } else {
        const text = await response.text()
        errorData = { message: text || response.statusText }
      }

      throw new ApiError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData.errors,
      )
    }

    return response
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new ApiError("Request timeout. Backend server may not be running.", 0)
    }
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(`Failed to connect to server: ${error.message}`, 0)
  }
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(endpoint)
    const json = await response.json()
    return extractResponseData<T>(json)
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
    const json = await response.json()
    return extractResponseData<T>(json)
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    const json = await response.json()
    return extractResponseData<T>(json)
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: "DELETE",
    })
    const json = await response.json()
    return extractResponseData<T>(json)
  },

  async postPublic<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
    const json = await response.json()
    return extractResponseData<T>(json)
  },
}
