import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BookOpen, Users, FileText, ArrowRight } from 'lucide-react'
import { teacher } from '../../lib/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function DashboardHome() {
  const [stats, setStats] = useState({ subjects: 0, students: 0, notes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [subjects, students, notes] = await Promise.all([
        teacher.subjects().catch(() => []),
        teacher.students().catch(() => []),
        teacher.notes.list().catch(() => [])
      ])
      setStats({
        subjects: subjects.length || 0,
        students: students.length || 0,
        notes: notes.length || 0
      })
    } catch (err) {
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, icon: Icon, value, label, linkTo }) => (
    <Card className="hover:shadow-card-hover transition-shadow overflow-hidden group">
      <div className="h-1 w-full bg-gradient-to-r from-[#0F766E] to-[#34D399]" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-600">{title}</CardTitle>
        <div className="p-2 bg-slate-50 rounded-md group-hover:bg-[#0F766E]/10 transition-colors">
          <Icon className="h-4 w-4 text-[#0F766E]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{loading ? '—' : value}</div>
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Portal</h1>
        <p className="text-slate-500 mt-1">Manage your assigned classes, modules, and secure resources.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="Assigned Subjects"
          icon={BookOpen}
          value={stats.subjects}
          label="Active courses this semester"
          linkTo="/teacher/subjects"
        />
        <StatCard
          title="My Students"
          icon={Users}
          value={stats.students}
          label="Enrolled in your sections"
          linkTo="/teacher/students"
        />
        <StatCard
          title="Secure Notes"
          icon={FileText}
          value={stats.notes}
          label="Uploaded resources"
          linkTo="/teacher/notes"
        />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold">Content Management Flow</CardTitle>
          <CardDescription>How to distribute resources securely</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] font-bold mb-3">1</div>
              <h3 className="font-semibold text-slate-900 text-sm">Verify Subjects</h3>
              <p className="text-sm text-slate-500">Check "My Subjects" to ensure admin has assigned you to the correct classes.</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] font-bold mb-3">2</div>
              <h3 className="font-semibold text-slate-900 text-sm">Create Modules</h3>
              <p className="text-sm text-slate-500">Go to "Modules" and create folders (e.g., "Unit 1") inside your subjects.</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] font-bold mb-3">3</div>
              <h3 className="font-semibold text-slate-900 text-sm">Upload Notes</h3>
              <p className="text-sm text-slate-500">Upload PDFs to your modules. They will be securely distributed and watermarked.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
