import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Clock, FileText, BookOpen, ArrowRight, Eye } from 'lucide-react'
import { student } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import SecurePDFViewer from '../SecurePDFViewer'
import EmptyState from '../ui/EmptyState'
import { Skeleton } from '../ui/design-system'

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

export default function RecentPage() {
  const { auth } = useAuth()
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [loading, setLoading] = useState(true)

  const location = useLocation()

  useEffect(() => {
    if (location.state?.autoOpenNote) {
      setSelectedNote(location.state.autoOpenNote)
      // clear the state so it doesn't reopen if they click back and refresh
      window.history.replaceState({}, '')
    }
    loadRecent()
  }, [])

  async function loadRecent() {
    try {
      const data = await student.recent(20)
      setNotes(data)
    } catch (err) {
      toast.error('Failed to load recent resources')
    } finally {
      setLoading(false)
    }
  }

  if (selectedNote) {
    return (
      <div className="space-y-4 max-w-5xl">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden border-t-4 border-t-[#0F766E]">
          <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#0F766E]/10 px-2 py-0.5 rounded">Secure Document</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-2">{selectedNote.title}</h2>
              {selectedNote.module_id?.title && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Folder: {selectedNote.module_id.title}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedNote(null)}
              className="shrink-0 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              ← Back to Recent
            </button>
          </div>
          <SecurePDFViewer
            srcUrl={student.viewNote(selectedNote._id)}
            token={auth?.token || ''}
            watermarkText="Acadence"
          />
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-4xl pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Recent Resources</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Your recently accessed academic materials</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notes.length === 0 ? (
        <motion.div variants={itemVariants} className="py-12">
          <EmptyState 
            icon={Clock} 
            title="No Recent Activity" 
            description="Resources you open will appear here for quick access." 
            action={
              <a href="/student/subjects" className="mt-4 inline-flex items-center gap-2 text-sm bg-[#0F766E] hover:bg-[#0D6B64] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                Browse Subjects <ArrowRight className="w-4 h-4" />
              </a>
            }
          />
        </motion.div>
      ) : (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <motion.div key={note._id} variants={itemVariants}>
              <button
                onClick={() => setSelectedNote(note)}
                className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-[#0F766E]/40 hover:shadow-sm hover:-translate-y-px transition-all duration-150 group flex items-center gap-4"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[#0F766E]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0F766E]/15 transition-colors">
                  <FileText className="w-5 h-5 text-[#0F766E]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm truncate group-hover:text-[#0F766E] transition-colors">{note.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {note.module_id?.title && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <BookOpen className="w-3 h-3" />
                        {note.module_id.title}
                      </span>
                    )}
                    {note.resource_type && (
                      <span className="text-xs text-slate-400 capitalize">{note.resource_type}</span>
                    )}
                  </div>
                </div>

                {/* Right: time + open */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">{timeAgo(note.updated_at || note.uploaded_at)}</span>
                  <div className="flex items-center gap-1 text-xs text-[#0F766E] font-medium">
                    <Eye className="w-3.5 h-3.5" /> Open
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
