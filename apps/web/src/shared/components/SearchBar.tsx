import { useState, useEffect, useRef } from 'react'
import { TextField, InputAdornment } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

export interface SearchBarProps {
  value?: string
  onSearch: (value: string) => void
  debounceMs?: number
  placeholder?: string
  fullWidth?: boolean
}

export function SearchBar({
  value = '',
  onSearch,
  debounceMs = 300,
  placeholder = 'Search...',
  fullWidth = true,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const isFirstRender = useRef(true)

  // Sync with external value prop only on mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setLocalValue(value)
    }
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onSearch])

  return (
    <TextField
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      fullWidth={fullWidth}
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  )
}
