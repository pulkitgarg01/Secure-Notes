import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Users, BookOpen, FileText, GraduationCap, ArrowRight, ShieldCheck, Activity, Clock, Plus, Database, Archive, BarChart3 } from 'lucide-react'
import { admin } from '../../lib/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import AnimatedCounter from '../ui/AnimatedCounter'
import KpiCard from '../ui/KpiCard'
import EmptyState from '../ui/EmptyState'
import { containerVariants, itemVariants, PageHero, Skeleton } from '../ui/design-system'

export default function DashboardHome() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

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

  const getActivityIcon = (action) => {
    switch (action) {
      case 'published': return <ShieldCheck className="w-4 h-4 text-emerald-600" />
      case 'archived': return <Archive className="w-4 h-4 text-slate-600 dark:text-slate-300" />
      case 'created': return <Plus className="w-4 h-4 text-blue-600" />
      case 'accessed': return <Activity className="w-4 h-4 text-indigo-600" />
      case 'assigned': return <BookOpen className="w-4 h-4 text-purple-600" />
      default: return <FileText className="w-4 h-4 text-slate-400" />
    }
  }

  // Stat cards config — all link to real filtered views
  const statCards = [
    { title: 'Active Faculty', icon: Users, value: stats?.teachers ?? 0, label: 'Active accounts', link: '/admin/users?role=teacher', color: '#2563EB', trend: { value: 2, label: 'vs last week' } },
    { title: 'Active Students', icon: GraduationCap, value: stats?.students ?? 0, label: 'Total enrolled', link: '/admin/users?role=student', color: '#9333EA', trend: { value: 15, label: 'vs last week' } },
    { title: 'Active Subjects', icon: Database, value: stats?.totalSubjects ?? 0, label: 'Platform subjects', link: '/admin/subjects', color: '#0F766E', trend: { value: 0, label: 'no change' } },
    { title: 'Published Resources', icon: ShieldCheck, value: stats?.publishedNotes ?? 0, label: 'Published files', link: '/admin/files?status=published', color: '#059669', trend: { value: 12, label: 'vs last week' } },
    { title: 'Draft Resources', icon: FileText, value: stats?.draftNotes ?? 0, label: 'Draft files', link: '/admin/files?status=draft', color: '#D97706', trend: { value: -3, label: 'vs last week' } },
    { title: 'Total Files', icon: BarChart3, value: stats?.notes ?? 0, label: 'Total stored', link: '/admin/files', color: '#475569', trend: { value: 9, label: 'vs last week' } },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-6 w-full"
    >
      {/* Header */}
      <PageHero 
        title="Operational Overview" 
        description="Platform utilization, resources, and recent system events."
        action={
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        }
      />

      {/* Stat Cards — all clickable */}
      <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map(({ title, icon: Icon, value, label, link, color, trend }) => (
          <KpiCard 
            key={title}
            title={title}
            value={value}
            icon={Icon}
            subtitle={label}
            to={link}
            loading={loading}
            color={color}
            trend={trend}
          />
        ))}
      </motion.div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Primary Content: Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 h-full">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900 h-full flex flex-col">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-950/50 shrink-0">
              <div>
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Platform Activity Log</CardTitle>
                <CardDescription>Recent actions across the platform.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-start gap-4 p-4">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !stats?.recentActivities?.length ? (
                <div className="p-10">
                  <EmptyState 
                    icon={Activity} 
                    title="No Recent Activity" 
                    description="There is no recent platform activity to display." 
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.recentActivities.map(activity => (
                    <motion.div 
                      key={activity._id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:shadow group-hover:scale-105 transition-all">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-100">
                          <span className="font-semibold text-slate-900 dark:text-slate-50">{activity.actor_name}</span>
                          {' '}
                          <span className="text-slate-600 dark:text-slate-300">{activity.action}</span>
                          {' '}
                          <span className="font-medium text-slate-800 dark:text-slate-100">{activity.target_name}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 group-hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Secondary Content: Faculty, Subjects, Quick Actions */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
        {/* Faculty list */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Faculty</CardTitle>
              <Link to="/admin/users?role=teacher" className="text-xs font-semibold text-[#0F766E] hover:text-[#0D6B64] flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats?.recentFaculty?.slice(0, 4).map(u => (
                  <Link key={u._id} to="/admin/users?role=teacher" className="flex items-center gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-semibold text-xs shrink-0 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0F766E] transition-colors">{u.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                    </div>
                  </Link>
                ))}
                {(!stats?.recentFaculty?.length) && (
                  <div className="p-4">
                    <EmptyState 
                      icon={Users} 
                      title="No Faculty" 
                      description="No faculty members found." 
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Subjects</CardTitle>
              <Link to="/admin/subjects" className="text-xs font-semibold text-[#0F766E] hover:text-[#0D6B64] flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats?.recentSubjects?.map(subject => (
                  <Link key={subject._id} to="/admin/subjects" className="flex items-center gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-7 h-7 rounded bg-[#0F766E]/5 border border-[#0F766E]/10 flex items-center justify-center group-hover:bg-[#0F766E]/10 transition-colors">
                      <BookOpen className="w-3.5 h-3.5 text-[#0F766E]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0F766E] transition-colors">{subject.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{subject.code}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {[
                { label: 'Manage Users', to: '/admin/users', icon: Users },
                { label: 'Manage Subjects', to: '/admin/subjects', icon: BookOpen },
                { label: 'Assign Faculty', to: '/admin/assign-subjects', icon: ShieldCheck },
              ].map(({ label, to, icon: Icon }) => (
                <Link key={to} to={to} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-[#0F766E]/30 hover:bg-slate-50 dark:hover:bg-slate-950 hover:shadow-sm transition-all text-sm text-slate-700 dark:text-slate-200 font-medium group hover:-translate-y-px">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#0F766E] transition-colors group-hover:scale-110 transform" />
                  {label}
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-300 group-hover:text-[#0F766E] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
