import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BookOpen, CheckCircle2, FileText, ArrowRight } from 'lucide-react'
import { student } from '../../lib/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function DashboardHome() {
  const [stats, setStats] = useState({ subjects: 0, completed: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [subjects, progress] = await Promise.all([
        student.subjects().catch(() => []),
        student.progress().catch(() => ({ completed: 0, total: 0 }))
      ])
      setStats({
        subjects: subjects.length || 0,
        completed: progress.completed || 0,
        total: progress.total || 0
      })
    } catch (err) {
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const StatCard = ({ title, icon: Icon, value, label, linkTo, valueElement }) => (
    <Card className="hover:shadow-card-hover transition-shadow overflow-hidden group">
      <div className="h-1 w-full bg-gradient-to-r from-[#0F766E] to-[#34D399]" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-600">{title}</CardTitle>
        <div className="p-2 bg-slate-50 rounded-md group-hover:bg-[#0F766E]/10 transition-colors">
          <Icon className="h-4 w-4 text-[#0F766E]" />
        </div>
      </CardHeader>
      <CardContent>
        {valueElement || <div className="text-3xl font-bold text-slate-900">{loading ? '—' : value}</div>}
        <p className="text-xs text-slate-500 mt-1 mb-3">{label}</p>
        <Link
          to={linkTo}
          className="text-xs font-medium text-[#0F766E] hover:text-[#0D6B64] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Portal</h1>
        <p className="text-slate-500 mt-1">Access your academic resources securely.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="My Subjects"
          icon={BookOpen}
          value={stats.subjects}
          label="Courses for your branch/semester"
          linkTo="/student/subjects"
        />
        <StatCard
          title="Progress"
          icon={CheckCircle2}
          value={`${stats.completed} / ${stats.total}`}
          label="Notes marked as complete"
          linkTo="/student/progress"
        />
        <StatCard
          title="Completion Rate"
          icon={FileText}
          label="Overall resource completion"
          linkTo="/student/progress"
          valueElement={
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-slate-900">{loading ? '—' : `${completionPercent}%`}</div>
              {!loading && stats.total > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 flex-1">
                  <div 
                    className="bg-[#0F766E] h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              )}
            </div>
          }
        />
      </div>

      <Card className="border-slate-200 shadow-sm bg-slate-50/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 rounded-full bg-[#0F766E]/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-8 h-8 text-[#0F766E]" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Start Learning</h3>
              <p className="text-sm text-slate-600 max-w-lg">
                Navigate to <strong>My Subjects</strong> to view available courses. Click on any subject to explore modules and securely view protected PDF notes.
              </p>
            </div>
            <div>
              <Link to="/student/subjects">
                <button className="px-5 py-2.5 rounded-md bg-[#0F766E] text-white text-sm font-medium hover:bg-[#0D6B64] transition-colors shadow-sm">
                  Browse Subjects
                </button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
