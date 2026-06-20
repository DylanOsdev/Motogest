import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { PublicRoute } from '../features/auth/components/PublicRoute'
import { PrivateRoute } from '../features/auth/components/PrivateRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { SignupPage } from '../features/auth/pages/SignupPage'
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage'
import { VerifyEmailSentPage } from '../features/auth/pages/VerifyEmailSentPage'
import { AppLayout } from './AppLayout'

// Lazy-loaded feature modules for code splitting
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'))
const ClientsPage = lazy(() => import('../features/clients/pages/ClientsPage'))
const VehiclesPage = lazy(() => import('../features/vehicles/pages/VehiclesPage'))
const MechanicsPage = lazy(() => import('../features/mechanics/pages/MechanicsPage'))
const SparePartsPage = lazy(() => import('../features/spare-parts/pages/SparePartsPage'))

function LoadingFallback() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
      <CircularProgress />
    </Box>
  )
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public auth routes — no layout */}
      <Route
        path="/login"
        element={<PublicRoute><LoginPage /></PublicRoute>}
      />
      <Route
        path="/signup"
        element={<PublicRoute><SignupPage /></PublicRoute>}
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />

      {/* Private routes — wrapped in AppLayout */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/clients"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ClientsPage />
            </Suspense>
          }
        />
        <Route
          path="/vehicles"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VehiclesPage />
            </Suspense>
          }
        />
        <Route
          path="/mechanics"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MechanicsPage />
            </Suspense>
          }
        />
        <Route
          path="/inventory"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SparePartsPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
