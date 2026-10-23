import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { CampsPage } from './pages/CampsPage';
import { CampDetailsPage } from './pages/CampDetailsPage';
import { CampMapPage } from './pages/CampMapPage';
import { ShortageAlertsPage } from './pages/ShortageAlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportSubmissionPage } from './pages/ReportSubmissionPage';
import { RequestsPage } from './pages/RequestsPage';
import { InventoryPage } from './pages/InventoryPage';
import { DonationsPage } from './pages/DonationsPage';
import { VolunteersPage } from './pages/VolunteersPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#FFFFFF',
                color: '#252B29',
                border: '1px solid #E5E3DC',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 12px rgba(32, 61, 53, 0.08)',
                borderRadius: '6px',
              },
              success: {
                iconTheme: {
                  primary: '#376653',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#B84F43',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />

          <Routes>
            {/* Standalone Citizen Needs Portal */}
            <Route path="/report-need" element={<ReportSubmissionPage />} />

            {/* Standalone Demo Role Switcher Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Main Operational Command Console */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="camps" element={<CampsPage />} />
              <Route path="camps/:id" element={<CampDetailsPage />} />
              <Route path="map" element={<CampMapPage />} />
              <Route path="alerts" element={<ShortageAlertsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="donations" element={<DonationsPage />} />
              <Route path="volunteers" element={<VolunteersPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
