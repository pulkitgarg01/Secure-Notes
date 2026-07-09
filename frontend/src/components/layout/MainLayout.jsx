import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ShieldCheck, LogOut, Menu, X } from 'lucide-react'

const ROLE_LABELS = {
  admin:   { label: 'Administrator', color: 'bg-violet-500/20 text-violet-300' },
  teacher: { label: 'Faculty',       color: 'bg-teal-500/20 text-teal-300' },
  student: { label: 'Student',       color: 'bg-blue-500/20 text-blue-300' },
}

export default function MainLayout({ children, sidebar, sidebarTitle }) {
  const { auth, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = auth?.user?.role || 'student'
  const roleInfo = ROLE_LABELS[role] || { label: role, color: 'bg-slate-500/20 text-slate-300' }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">

      {/* ── Mobile overlay ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside
        className={[
          'fixed top-0 left-0 h-full w-64 flex flex-col z-50 bg-[#0F172A]',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:relative lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#0F766E] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">Acadence</span>
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {sidebarTitle && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {sidebarTitle}
            </p>
          )}
          {sidebar}
        </div>

        {/* User footer */}
        <div className="shrink-0 border-t border-white/5 p-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#0F766E]/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[#34D399]">
                {(auth?.user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Name + role */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{auth?.user?.name}</p>
              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
            {/* Logout */}
            <button
              onClick={logout}
              className="shrink-0 text-slate-400 hover:text-white p-1.5 rounded hover:bg-white/5"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile only — just hamburger) */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-[#E2E8F0] bg-white shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span className="font-bold text-[#0F172A] text-sm">Acadence</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
