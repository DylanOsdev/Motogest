/**
 * Shared API types for paginated responses and query parameters.
 * These types align with the backend API contract.
 */

/**
 * Standard paginated response from the API.
 * All list endpoints return data wrapped in this structure.
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Query parameters for paginated list endpoints.
 */
export interface QueryParams {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: string | number | undefined
}

/**
 * Standard API error response shape.
 */
export interface ApiErrorResponse {
  statusCode: number
  error: string
  message: string | string[]
}
