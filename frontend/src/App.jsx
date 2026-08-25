import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './components/Login.jsx'
import AdminDashboard from './components/admin/AdminDashboard.jsx'
import TeacherDashboard from './components/teacher/TeacherDashboard.jsx'
import StudentDashboard from './components/student/StudentDashboard.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

function ProtectedRoute({ children, allowedRoles }) {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  const { auth } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={!auth ? <Login /> : <Navigate to="/" replace />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          auth ? (
            auth.user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : auth.user.role === 'teacher' ? (
              <Navigate to="/teacher" replace />
            ) : (
              <Navigate to="/student" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                className: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 text-slate-900 dark:text-slate-50 shadow-2xl rounded-xl px-4 py-3',
                descriptionClassName: 'text-slate-500 dark:text-slate-400 text-sm font-medium',
                actionButton: {
                  style: {
                    background: '#0F766E',
                    color: 'white',
                    borderRadius: '6px',
                  }
                }
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
