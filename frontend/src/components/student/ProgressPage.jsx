import React, { useEffect, useState } from 'react'
import { BarChart3, CheckCircle2, BookOpen, FileText, TrendingUp, Clock } from 'lucide-react'
import { student } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import EmptyState from '../ui/EmptyState'
import KpiCard from '../ui/KpiCard'
import { Skeleton } from '../ui/design-system'

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function ProgressPage() {
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0, bySubject: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadProgress() }, [])

  async function loadProgress() {
    try {
      const data = await student.progress()
      setProgress(data || { completed: 0, total: 0, percentage: 0, bySubject: [] })
    } catch (err) {
      toast.error('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  const bySubject = progress.bySubject || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 max-w-4xl pb-4">
      {/* Header */}
      <motion.div variants={itemVariants} className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">My Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your learning across all enrolled subjects</p>
      </motion.div>

      {/* Overall summary */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <KpiCard 
          title="Resources Viewed" 
          value={progress.completed} 
          icon={CheckCircle2} 
          subtitle="Total completions" 
          trend={{ value: 18, label: 'this week' }}
        />
        <KpiCard 
          title="Total Resources" 
          value={progress.total} 
          icon={FileText} 
          subtitle="Available content" 
          trend={{ value: 5, label: 'new uploads' }}
        />
        <KpiCard 
          title="Overall Completion" 
          value={loading ? '—' : progress.percentage} 
          suffix="%"
          icon={TrendingUp} 
          subtitle="Across all courses" 
          trend={{ value: 2, label: 'steady progress' }}
        />
      </motion.div>

      {/* Global progress bar */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Overall Progress</span>
          <span className="text-sm font-bold text-[#0F766E]">{progress.percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-2.5 rounded-full bg-gradient-to-r from-[#0F766E] to-[#34D399]"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{progress.completed} of {progress.total} resources marked complete</p>
      </motion.div>

      {/* Per-subject breakdown */}
      <motion.div variants={itemVariants}>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0F766E]" />
          Progress by Subject
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : bySubject.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              icon={BarChart3} 
              title="No Progress Data" 
              description="Start browsing your subjects and opening resources to see progress here." 
            />
          </div>
        ) : (
          <div className="space-y-3">
            {bySubject.map((item, i) => {
              const pct = item.percentage
              const barColor = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#3B82F6'
              return (
                <motion.div
                  key={item.subject._id}
                  variants={itemVariants}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.subject.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{item.subject.code}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold" style={{ color: barColor }}>{pct}%</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.completed}/{item.total} done</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ background: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
