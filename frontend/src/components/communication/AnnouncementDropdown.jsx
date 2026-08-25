import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Plus, X, ChevronDown, Check } from 'lucide-react'
import { communication } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

// Fetch subjects based on role
async function fetchSubjects(role) {
  if (role === 'teacher') {
    const { teacher } = await import('../../lib/api')
    return teacher.subjects()
  }
  // admin
  const { academic } = await import('../../lib/api')
  return academic.subjects.list()
}

export default function AnnouncementDropdown() {
  const { auth } = useAuth()
  const user = auth?.user
  const role = user?.role

  const [isOpen, setIsOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements()
      if (isComposing && subjects.length === 0) {
        fetchSubjects(role).then(setSubjects).catch(() => {})
      }
    }
  }, [isOpen, isComposing])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setIsComposing(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Allow external trigger to open & show compose panel
  useEffect(() => {
    const handler = () => {
      setIsOpen(true)
      setIsComposing(true)
      if (subjects.length === 0) {
        fetchSubjects(role).then(setSubjects).catch(() => {})
      }
    }
    document.addEventListener('acadence:open-announcement', handler)
    return () => document.removeEventListener('acadence:open-announcement', handler)
  }, [role, subjects.length])

  const fetchAnnouncements = async () => {
    try {
      const data = await communication.announcements.list()
      setAnnouncements(data)
    } catch (err) {
      console.error('Failed to fetch announcements', err)
    }
  }

  const handleCompose = () => {
    setIsComposing(true)
    setSent(false)
    if (subjects.length === 0) {
      fetchSubjects(role).then(setSubjects).catch(() => {})
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!selectedSubject || !title.trim()) return
    setSending(true)
    try {
      await communication.announcements.create({ subject_id: selectedSubject, title: title.trim(), body: body.trim() })
      setSent(true)
      setTitle('')
      setBody('')
      setSelectedSubject('')
      fetchAnnouncements()
      setTimeout(() => {
        setSent(false)
        setIsComposing(false)
      }, 1800)
    } catch (err) {
      console.error('Failed to send announcement', err)
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsComposing(false)
    setSent(false)
    setTitle('')
    setBody('')
    setSelectedSubject('')
  }

  if (role !== 'teacher' && role !== 'admin') return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none"
        aria-label="Announcements"
        title="Announcements"
      >
        <Megaphone className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {announcements.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[4.5rem] right-[4.5rem] w-[22rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-[999] origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Announcements</h3>
                {announcements.length > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                    {announcements.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!isComposing && (
                  <button
                    onClick={handleCompose}
                    className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </button>
                )}
                <button onClick={handleClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Compose Panel */}
            <AnimatePresence>
              {isComposing && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSend}
                  className="overflow-hidden border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="p-4 space-y-3 bg-emerald-50/50 dark:bg-emerald-900/10">
                    {sent ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center py-6 gap-2"
                      >
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Announcement sent!</p>
                      </motion.div>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Subject</label>
                          <div className="relative">
                            <select
                              value={selectedSubject}
                              onChange={(e) => setSelectedSubject(e.target.value)}
                              required
                              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-8 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none"
                            >
                              <option value="">Select a subject…</option>
                              {subjects.map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.code ? `${s.code} – ${s.name}` : s.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Title</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Lab cancelled today"
                            className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Message (optional)</label>
                          <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={3}
                            placeholder="Add details…"
                            className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsComposing(false)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={sending || !selectedSubject || !title.trim()}
                            className="text-xs px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            {sending ? (
                              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75" /></svg>
                            ) : (
                              <Megaphone className="w-3 h-3" />
                            )}
                            {sending ? 'Sending…' : 'Send'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Sent Announcements list */}
            <div className="max-h-72 overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  No announcements sent yet.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann._id}
                    className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ann.title}</p>
                        {ann.subject_id && (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {ann.subject_id.code || ann.subject_id.name}
                          </span>
                        )}
                        {ann.body && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ann.body}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
              <span className="text-xs text-slate-400">Students are notified automatically</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
