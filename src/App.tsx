import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ReminderProvider } from './context/ReminderContext.tsx';
import { JobTrackerProvider } from './context/JobTrackerContext.tsx';
import { SearchProvider } from './context/SearchContext.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';
import { AppShell } from './components/layout/AppShell.tsx';

// Pages
import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Applications } from './pages/Applications.tsx';
import { Board } from './pages/Board.tsx';
import { Resumes } from './pages/Resumes.tsx';
import { Reminders } from './pages/Reminders.tsx';
import { NotFound } from './pages/NotFound.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ReminderProvider>
            <JobTrackerProvider>
              <SearchProvider>
                <BrowserRouter>
                <Routes>
                  {/* Public Authentication Route */}
                  <Route path="/login" element={<Login />} />

                  {/* Protected Application Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Navigate to="/" replace />} />
                    <Route path="applications" element={<Applications />} />
                    <Route path="board" element={<Board />} />
                    <Route path="resumes" element={<Resumes />} />
                    <Route path="reminders" element={<Reminders />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Catch-all global 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SearchProvider>
          </JobTrackerProvider>
        </ReminderProvider>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
