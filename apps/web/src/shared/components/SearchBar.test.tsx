import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { SearchBar } from './SearchBar'
import { renderWithProviders } from '../../test/renderWithProviders'

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render with placeholder', () => {
    renderWithProviders(<SearchBar onSearch={vi.fn()} placeholder="Search clients..." />)

    expect(screen.getByPlaceholderText('Search clients...')).toBeInTheDocument()
  })

  it('should call onSearch after debounce', () => {
    const onSearch = vi.fn()

    renderWithProviders(<SearchBar onSearch={onSearch} debounceMs={300} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })

    // Advance timers to trigger debounce
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onSearch).toHaveBeenCalledWith('test')
  })

  it('should not call onSearch before debounce completes', () => {
    const onSearch = vi.fn()

    renderWithProviders(<SearchBar onSearch={onSearch} debounceMs={300} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'te' } })

    // Only advance 100ms - less than debounce
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('should display initial value', () => {
    renderWithProviders(<SearchBar onSearch={vi.fn()} value="initial" />)

    expect(screen.getByRole('textbox')).toHaveValue('initial')
  })
})
