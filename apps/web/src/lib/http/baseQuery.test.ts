import { describe, it, expect, vi, beforeEach } from 'vitest'
import { httpClientBaseQuery } from './baseQuery'
import { httpClient } from './axios'

vi.mock('./axios', () => ({
  httpClient: {
    request: vi.fn(),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedRequest = vi.mocked(httpClient.request) as any

describe('httpClientBaseQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return data on successful request', async () => {
    const mockData = { id: 1, name: 'Test' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedRequest.mockResolvedValueOnce({ data: mockData } as any)

    const result = await httpClientBaseQuery(
      { url: '/test', method: 'GET' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    )

    expect(result).toEqual({ data: mockData })
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/test',
      method: 'GET',
      data: undefined,
      params: undefined,
    })
  })

  it('should pass body and params to httpClient', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedRequest.mockResolvedValueOnce({ data: {} } as any)

    await httpClientBaseQuery(
      {
        url: '/test',
        method: 'POST',
        body: { name: 'Test' },
        params: { page: 1 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    )

    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/test',
      method: 'POST',
      data: { name: 'Test' },
      params: { page: 1 },
    })
  })

  it('should map axios error to RTK Query error shape', async () => {
    const axiosError = {
      response: {
        status: 404,
        data: { statusCode: 404, error: 'Not Found', message: 'Resource not found' },
      },
    }
    mockedRequest.mockRejectedValueOnce(axiosError)

    const result = await httpClientBaseQuery(
      { url: '/test', method: 'GET' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    )

    expect(result).toEqual({
      error: {
        status: 404,
        data: axiosError.response.data,
      },
    })
  })

  it('should handle network errors without response', async () => {
    mockedRequest.mockRejectedValueOnce(new Error('Network error'))

    const result = await httpClientBaseQuery(
      { url: '/test', method: 'GET' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    )

    expect(result).toEqual({
      error: {
        status: 'FETCH_ERROR',
        data: { message: 'Network error' },
      },
    })
  })

  it('should default to GET method when not specified', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedRequest.mockResolvedValueOnce({ data: {} } as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await httpClientBaseQuery({ url: '/test' }, {} as any, {} as any)

    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/test',
      method: 'GET',
      data: undefined,
      params: undefined,
    })
  })
})
