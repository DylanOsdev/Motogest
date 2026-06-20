import { createApi } from '@reduxjs/toolkit/query/react'
import { httpClientBaseQuery } from './baseQuery'

/**
 * Base RTK Query API instance.
 *
 * Uses the custom httpClientBaseQuery to preserve token refresh interceptors.
 * Feature modules use `injectEndpoints` to add their own endpoints while
 * sharing this base instance for consistent cache management.
 */
export const api = createApi({
  baseQuery: httpClientBaseQuery,
  tagTypes: ['Client', 'Vehicle', 'Mechanic', 'SparePart'],
  endpoints: () => ({}),
})
