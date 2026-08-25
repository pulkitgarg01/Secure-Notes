import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Menu, X, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '../ui/ThemeToggle'
import { CommandPalette } from '../ui/CommandPalette'
import NotificationDropdown from '../communication/NotificationDropdown'
import AnnouncementDropdown from '../communication/AnnouncementDropdown'

const ROLE_LABELS = {
  admin:   { label: 'Administrator', color: 'bg-violet-500/20 text-violet-300' },
  teacher: { label: 'Faculty',       color: 'bg-teal-500/20 text-teal-300' },
  student: { label: 'Student',       color: 'bg-blue-500/20 text-blue-300' },
}

export default function MainLayout({ children, navigation, sidebarTitle }) {
  const { auth, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { pathname } = useLocation()
  
  const role = auth?.user?.role || 'student'
  const roleInfo = ROLE_LABELS[role] || { label: role, color: 'bg-slate-500/20 text-slate-300' }

  const triggerCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <div className="relative h-screen w-full flex font-sans bg-slate-50 dark:bg-[#020617] overflow-hidden">
      {/* 1. Ambient Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* 2. Tactile Noise Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ width: isCollapsed ? 72 : 256 }}
        className={`fixed top-0 left-0 h-screen flex flex-col z-50 bg-[#121316] border-r border-slate-800 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:z-10 shrink-0 shadow-2xl lg:shadow-none ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`flex shrink-0 border-b border-slate-800/60 ${isCollapsed ? 'flex-col items-center justify-center py-4 gap-4' : 'items-center h-16 justify-between px-4'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#0D6B64] flex items-center justify-center shadow-inner shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-white drop-shadow-sm" fill="currentColor">
                <path d="M12 2L3 22h4.5l1.8-4h5.4l1.8 4H21L12 2zm-1.8 11L12 8.5 13.8 13h-3.6z"/>
              </svg>
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="text-white font-semibold text-lg tracking-tight whitespace-nowrap"
              >
                Acadence
              </motion.span>
            )}
          </div>
          
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors ${isCollapsed ? 'w-8 h-8 items-center justify-center' : ''}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {/* Global Search / Command Palette Trigger */}
          <button
            onClick={triggerCommandPalette}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'} mb-4 rounded-lg bg-[#121316] hover:bg-[#1A1C23] border border-slate-700/50 hover:border-slate-600 transition-colors group cursor-pointer text-slate-400`}
            title="Search (⌘K)"
          >
            <div className="flex items-center gap-3">
              <Search className={`w-[18px] h-[18px] shrink-0 group-hover:text-slate-200 transition-colors ${isCollapsed ? '' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="text-sm font-medium group-hover:text-slate-200 transition-colors">Search...</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                <span>⌘</span><span>K</span>
              </div>
            )}
          </button>

          {!isCollapsed && sidebarTitle && (
            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {sidebarTitle}
            </p>
          )}

          {navigation?.map((item, index) => {
            if (item.type === 'header') {
              return isCollapsed ? (
                <div key={index} className="h-4" />
              ) : (
                <p key={index} className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
              )
            }

            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
            
            return (
              <div key={item.to || index} className="relative group">
                <Link to={item.to} className="block relative z-10" onClick={() => setMobileOpen(false)}>
                  <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}>
                    <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                </Link>
                
                {/* Animated Vercel-style Active Background */}
                {active && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-[#25282F] border border-slate-700/50 rounded-lg shadow-sm"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl border border-slate-700">
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom Profile Section */}
        <div className="shrink-0 p-3 space-y-2">
          <ThemeToggle isCollapsed={isCollapsed} />
          <div className="relative group">
            <button 
              onClick={logout}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-slate-800 transition-all cursor-pointer`}
              title="Sign out"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-[#121316]">
                  <span className="text-xs font-bold text-white shadow-sm">
                    {(auth?.user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 text-left flex-1">
                    <p className="text-sm font-semibold text-white truncate leading-tight">{auth?.user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{roleInfo.label}</p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-white transition-colors" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Global Command Palette */}
      <CommandPalette />

      {/* Main Area */}
      <div 
        className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-transparent transition-colors duration-200 z-10 relative"
        style={{ 
          '--hero-pr': (role === 'teacher' || role === 'admin') && !pathname.includes('/inbox') 
            ? '7rem' // 112px for 2 icons + gap
            : '3.75rem' // 60px for 1 icon + gap 
        }}
      >
        <div className="absolute top-8 right-8 z-50 hidden lg:flex items-center gap-3">
          {(role === 'teacher' || role === 'admin') && !pathname.includes('/inbox') && (
            <AnnouncementDropdown />
          )}
          <NotificationDropdown />
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 shadow-sm z-30">
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 ml-3">
              <div className="w-6 h-6 rounded bg-[#0F766E] flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
                  <path d="M12 2L3 22h4.5l1.8-4h5.4l1.8 4H21L12 2zm-1.8 11L12 8.5 13.8 13h-3.6z"/>
                </svg>
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm tracking-tight">Acadence</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(role === 'teacher' || role === 'admin') && <AnnouncementDropdown />}
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
