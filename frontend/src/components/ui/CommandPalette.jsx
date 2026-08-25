import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home, Users, FolderOpen, LogOut, Sun, Moon, Laptop, UserCog, GitBranch, Calendar, Layers, BookOpen, FileText, Search, Clock, CheckCircle2, LayoutDashboard, MessageSquare, Megaphone, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeContext'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { auth, logout } = useAuth()
  const user = auth?.user
  const { theme, setTheme } = useTheme()

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command) => {
    setOpen(false)
    command()
  }

  // Define paths based on role
  const rolePrefix = user?.role === 'admin' ? '/admin' : user?.role === 'student' ? '/student' : '/teacher'

  if (!user) return null

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto overflow-hidden flex flex-col"
            >
              <Command className="flex flex-col w-full h-full" loop>
                <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800" cmdk-input-wrapper="">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <Command.Input 
                    autoFocus 
                    placeholder="Type a command or search..." 
                    className="flex-1 bg-transparent border-0 h-14 px-3 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-base"
                  />
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    <kbd>ESC</kbd>
                  </div>
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
                  <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No results found.
                  </Command.Empty>

                  <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {(user.role === 'admin' || user.role === 'teacher') && (
                      <Command.Item 
                        onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent('acadence:open-announcement')))}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 cursor-pointer aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-900/30 transition-colors"
                      >
                        <Megaphone className="w-4 h-4 text-emerald-500" />
                        New Announcement
                      </Command.Item>
                    )}
                    <Command.Item 
                      onSelect={() => runCommand(() => navigate(`${rolePrefix}/inbox`, { state: { openCompose: true } }))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#0F766E] dark:text-[#5EEAD4] cursor-pointer aria-selected:bg-teal-50 dark:aria-selected:bg-teal-900/30 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#0F766E] dark:text-[#5EEAD4]" />
                      New Message
                    </Command.Item>
                  </Command.Group>

                  <Command.Group heading="Navigation" className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Command.Item 
                      onSelect={() => runCommand(() => navigate(rolePrefix))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </Command.Item>
                    
                    <Command.Item 
                      onSelect={() => runCommand(() => navigate(`${rolePrefix}/inbox`))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      Inbox
                    </Command.Item>
                    
                    {user.role === 'admin' && (
                      <>
                        <Command.Item onSelect={() => runCommand(() => navigate('/admin/users'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Users className="w-4 h-4 text-slate-400" />
                          Manage Users
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/admin/assignments'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <UserCog className="w-4 h-4 text-slate-400" />
                          Assign Subjects
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/admin/branches'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <GitBranch className="w-4 h-4 text-slate-400" />
                          Branches
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/admin/semesters'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Semesters
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/admin/sections'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Layers className="w-4 h-4 text-slate-400" />
                          Sections
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/admin/subjects'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          Subjects
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/admin/files'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <FileText className="w-4 h-4 text-slate-400" />
                          Platform Files
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent('acadence:open-announcement')))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Megaphone className="w-4 h-4 text-slate-400" />
                          Announcements
                        </Command.Item>
                      </>
                    )}

                    {user.role === 'teacher' && (
                      <>
                        <Command.Item onSelect={() => runCommand(() => navigate('/teacher/subjects'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          My Subjects
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/teacher/students'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Users className="w-4 h-4 text-slate-400" />
                          My Students
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/teacher/modules'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <FolderOpen className="w-4 h-4 text-slate-400" />
                          Modules & Folders
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/teacher/notes'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <FileText className="w-4 h-4 text-slate-400" />
                          Resources
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/teacher/tasks'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Assignments
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => document.dispatchEvent(new CustomEvent('acadence:open-announcement')))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Megaphone className="w-4 h-4 text-slate-400" />
                          Announcements
                        </Command.Item>
                      </>
                    )}

                    {user.role === 'student' && (
                      <>
                        <Command.Item onSelect={() => runCommand(() => navigate('/student/search'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Search className="w-4 h-4 text-slate-400" />
                          Search
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/student/subjects'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          My Subjects
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/student/tasks'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Deadlines
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/student/recent'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Recent Resources
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/student/progress'))} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors">
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                          Progress
                        </Command.Item>
                      </>
                    )}
                  </Command.Group>

                  <Command.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />

                  <Command.Group heading="Preferences" className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Command.Item 
                      onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                        Toggle Theme
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">T</span>
                    </Command.Item>
                  </Command.Group>

                  <Command.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />

                  <Command.Group heading="Account" className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Command.Item 
                      onSelect={() => runCommand(() => logout())}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-600 dark:text-rose-500 cursor-pointer aria-selected:bg-rose-50 dark:aria-selected:bg-rose-500/10 aria-selected:text-rose-700 dark:aria-selected:text-rose-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </Command.Item>
                  </Command.Group>

                </Command.List>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
