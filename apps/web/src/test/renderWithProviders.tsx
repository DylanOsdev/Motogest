import type { RenderResult } from '@testing-library/react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { configureStore, combineReducers, type Reducer } from '@reduxjs/toolkit'
import authReducer, { type AuthState } from '../features/auth/slices/authSlice'
import { api } from '../lib/http/api'
import { theme } from '../lib/theme'

interface RenderOptions {
  preloadedState?: { auth?: Partial<AuthState> }
  initialEntries?: string[]
  additionalReducers?: Record<string, Reducer>
}

export function renderWithProviders(
  ui: React.ReactElement,
  { preloadedState = {}, initialEntries = ['/'], additionalReducers = {} }: RenderOptions = {},
): RenderResult & { store: ReturnType<typeof configureStore> } {
  const authInitial: AuthState = {
    user: null,
    accessToken: null,
    status: 'idle',
    error: null,
    ...preloadedState.auth,
  }

  const rootReducer = combineReducers({
    auth: authReducer,
    [api.reducerPath]: api.reducer,
    ...additionalReducers,
  })

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: { auth: authInitial },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  )

  const result = render(ui, { wrapper: Wrapper })
  return { ...result, store }
}
