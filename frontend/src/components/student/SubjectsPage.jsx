import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, Users, FileText, Calendar } from 'lucide-react'
import { student } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import AnimatedCounter from '../ui/AnimatedCounter'
import KpiCard from '../ui/KpiCard'
import { Skeleton } from '../ui/design-system'

function formatDate(date) {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSubjects() }, [])

  async function loadSubjects() {
    try {
      const data = await student.subjects()
      setSubjects(data)
    } catch (err) {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  // Color palette for subject cards
  const colors = [
    { accent: '#0F766E', light: 'rgba(15,118,110,0.08)', border: 'rgba(15,118,110,0.2)' },
    { accent: '#2563EB', light: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)' },
    { accent: '#7C3AED', light: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' },
    { accent: '#D97706', light: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)' },
    { accent: '#DC2626', light: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 max-w-6xl pb-4">
      {/* Header */}
      <motion.div variants={itemVariants} className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">My Subjects</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Your enrolled courses for this semester</p>
      </motion.div>

      {/* KPI Cards */}
      {!loading && subjects.length > 0 && (
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
          <KpiCard 
            title="Enrolled Subjects" 
            value={subjects.length} 
            icon={BookOpen} 
            subtitle="Active courses" 
            trend={{ value: 3, label: 'this semester' }}
          />
          <KpiCard 
            title="Total Resources" 
            value={subjects.reduce((a, s) => a + (s.resource_count || 0), 0)} 
            icon={FileText} 
            subtitle="Available secure files" 
            trend={{ value: 12, label: 'new uploads' }}
          />
          <KpiCard 
            title="Semester Status" 
            value="Active" 
            icon={Calendar} 
            subtitle="In progress" 
            trend={{ value: 100, label: 'on track' }}
          />
        </motion.div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No subjects available</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">
            Make sure you're assigned to a branch, semester, and section by your administrator.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, i) => {
            const color = colors[i % colors.length]
            return (
              <motion.div key={subject._id} variants={itemVariants}>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group h-full flex flex-col">
                  {/* Top accent bar */}
                  <div className="h-1" style={{ background: `linear-gradient(90deg, ${color.accent}, ${color.accent}99)` }} />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Subject Code badge */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ color: color.accent, background: color.light, border: `1px solid ${color.border}` }}
                      >
                        {subject.code}
                      </span>
                      <span className="text-xs text-slate-400">Sem {subject.semester_id?.number}</span>
                    </div>

                    {/* Subject Name */}
                    <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base leading-tight mb-1">{subject.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{subject.branch_id?.name}</p>

                    {/* Meta row */}
                    <div className="mt-auto space-y-2">
                      {subject.faculty && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate">{subject.faculty.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{subject.resource_count ?? 0} resources</span>
                        </div>
                        {subject.last_updated && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(subject.last_updated)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      to={`/student/subjects/${subject._id}`}
                      state={{ color }}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-semibold transition-all border group-hover:border-transparent"
                      style={{
                        background: color.light,
                        color: color.accent,
                        border: `1px solid ${color.border}`
                      }}
                    >
                      Browse Modules
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
