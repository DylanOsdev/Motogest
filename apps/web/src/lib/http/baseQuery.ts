import type { BaseQueryFn, FetchArgs } from '@reduxjs/toolkit/query/react'
import { httpClient } from './axios'
import type { ApiErrorResponse } from '../../shared/types/api'

/**
 * Custom RTK Query baseQuery that wraps the existing axios httpClient.
 *
 * This preserves the token refresh interceptors configured in axios.ts,
 * so RTK Query gets automatic 401→refresh→retry for free without duplicating
 * auth logic.
 *
 * Errors are mapped to RTK Query's expected shape so query/mutation hooks
 * receive properly typed error responses.
 */
export const httpClientBaseQuery: BaseQueryFn<FetchArgs> = async ({
  url,
  method = 'GET',
  body,
  params,
}) => {
  try {
    const response = await httpClient.request({
      url,
      method,
      data: body,
      params,
    })
    return { data: response.data }
  } catch (error) {
    // Map axios error to RTK Query FetchBaseQueryError shape
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status: number; data: ApiErrorResponse }
      }
      return {
        error: {
          status: axiosError.response?.status ?? 'FETCH_ERROR',
          data: axiosError.response?.data,
        },
      }
    }

    // Network error or request cancelled
    return {
      error: {
        status: 'FETCH_ERROR',
        data: { message: 'Network error' },
      },
    }
  }
}
