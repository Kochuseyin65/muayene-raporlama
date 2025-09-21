import { useMemo } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider, useSelector } from 'react-redux'
import { store, type RootState } from '@/store/store'
import { ThemeProvider, CssBaseline } from '@mui/material'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import PermissionRoute from '@/components/routing/PermissionRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import CustomersPage from '@/features/customers/CustomersPage'
import EquipmentPage from '@/features/equipment/EquipmentPage'
import TechniciansPage from '@/features/technicians/TechniciansPage'
import { getAppTheme } from '@/theme/theme'
import AuthInitializer from '@/components/auth/AuthInitializer'
import OffersPage from '@/features/offers/OffersPage'
import OfferDetailPage from '@/features/offers/OfferDetailPage'
import WorkOrdersPage from '@/features/workOrders/WorkOrdersPage'
import WorkOrderDetailPage from '@/features/workOrders/WorkOrderDetailPage'
import InspectionsPage from '@/features/inspections/InspectionsPage'
import InspectionDetailPage from '@/features/inspections/InspectionDetailPage'
import InspectionFormPage from '@/features/inspections/InspectionFormPage'
import InspectionPhotosPage from '@/features/inspections/InspectionPhotosPage'
import InspectionReportPage from '@/features/inspections/InspectionReportPage'
import MyWorkOrdersPage from '@/features/workOrders/MyWorkOrdersPage'
import MyInspectionsPage from '@/features/inspections/MyInspectionsPage'
import ReportPublicPage from '@/features/reports/ReportPublicPage'

function ThemedApp() {
  const mode = useSelector((s: RootState) => s.ui.theme)
  const theme = useMemo(() => getAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthInitializer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reports/public/:token" element={<ReportPublicPage />} />
          <Route element={<ProtectedRoute />}> 
            <Route
              path="/"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route element={<PermissionRoute permission="viewCustomers" />}>
              <Route
                path="/customers"
                element={
                  <AppLayout>
                    <CustomersPage />
                  </AppLayout>
                }
              />
            </Route>
            <Route element={<PermissionRoute permission="viewOffers" />}>
              <Route
                path="/offers"
                element={
                  <AppLayout>
                    <OffersPage />
                  </AppLayout>
                }
              />
              <Route
                path="/offers/:id"
                element={
                  <AppLayout>
                    <OfferDetailPage />
                  </AppLayout>
                }
              />
            </Route>
            <Route element={<PermissionRoute permission="viewWorkOrders" />}>
              <Route
                path="/work-orders"
                element={
                  <AppLayout>
                    <WorkOrdersPage />
                  </AppLayout>
                }
              />
              <Route
                path="/my/work-orders"
                element={
                  <AppLayout>
                    <MyWorkOrdersPage />
                  </AppLayout>
                }
              />
              <Route
                path="/work-orders/:id"
                element={
                  <AppLayout>
                    <WorkOrderDetailPage />
                  </AppLayout>
                }
              />
            </Route>
            <Route element={<PermissionRoute permission="viewEquipment" />}>
              <Route
                path="/equipment"
                element={
                  <AppLayout>
                  <EquipmentPage />
                  </AppLayout>
                }
              />
            </Route>
            <Route element={<PermissionRoute permission="viewInspections" />}>
              <Route
                path="/inspections"
                element={
                  <AppLayout>
                    <InspectionsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/my/inspections"
                element={
                  <AppLayout>
                    <MyInspectionsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inspections/:id"
                element={
                  <AppLayout>
                    <InspectionDetailPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inspections/:id/form"
                element={
                  <AppLayout>
                    <InspectionFormPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inspections/:id/photos"
                element={
                  <AppLayout>
                    <InspectionPhotosPage />
                  </AppLayout>
                }
              />
              <Route
                path="/inspections/:id/report"
                element={
                  <AppLayout>
                    <InspectionReportPage />
                  </AppLayout>
                }
              />
            </Route>
            <Route element={<PermissionRoute permission="viewTechnicians" />}>
              <Route
                path="/technicians"
                element={
                  <AppLayout>
                    <TechniciansPage />
                  </AppLayout>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  )
}
