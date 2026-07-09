import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Users, BookOpen, FileText, GraduationCap, ArrowRight } from 'lucide-react'
import { admin } from '../../lib/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function DashboardHome() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await admin.stats()
      setStats(data)
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
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Administration</h1>
        <p className="text-slate-500 mt-1">Manage users, academic structure, and platform settings.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Teachers"
          icon={Users}
          value={stats?.teachers || 0}
          label="Active faculty accounts"
          linkTo="/admin/users"
        />
        <StatCard
          title="Students"
          icon={GraduationCap}
          value={stats?.students || 0}
          label="Enrolled student accounts"
          linkTo="/admin/users"
        />
        <StatCard
          title="Subjects"
          icon={BookOpen}
          value="—" // Not returning in backend yet
          label="Total configured subjects"
          linkTo="/admin/subjects"
        />
        <StatCard
          title="Notes"
          icon={FileText}
          value={stats?.notes || 0}
          label="Secure PDFs distributed"
          linkTo="/admin" // Admin doesn't have direct notes view yet
        />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold">Quick Start Guide</CardTitle>
          <CardDescription>Follow these steps to set up the academic hierarchy</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-900 text-xs">1</div>
                <div>
                  <strong className="text-slate-900 block">Create structure</strong>
                  Define Branches, then Semesters, then Sections.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-900 text-xs">2</div>
                <div>
                  <strong className="text-slate-900 block">Add subjects</strong>
                  Create Subjects and assign them to specific semesters.
                </div>
              </div>
            </div>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-900 text-xs">3</div>
                <div>
                  <strong className="text-slate-900 block">Onboard faculty</strong>
                  Create teacher accounts in User Management.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-900 text-xs">4</div>
                <div>
                  <strong className="text-slate-900 block">Assign classes</strong>
                  Assign teachers to specific subjects and sections.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
