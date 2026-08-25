import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BookOpen, FileText, ArrowRight, Clock, TrendingUp, Eye, Users, BarChart3, CheckCircle2, MessageSquare, Calendar } from 'lucide-react'
import { teacher } from '../../lib/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import AnimatedCounter from '../ui/AnimatedCounter'
import KpiCard from '../ui/KpiCard'
import EmptyState from '../ui/EmptyState'
import { containerVariants, itemVariants, PageHero, Skeleton } from '../ui/design-system'
import { TrendChart } from '../ui/TrendChart'

function timeAgo(date) {
  if (!date) return 'Never'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function DashboardHome() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const { auth } = useAuth()
  const user = auth?.user

  useEffect(() => {
    Promise.all([
      teacher.stats().catch(() => null),
      teacher.analytics().catch(() => null)
    ]).then(([s, a]) => {
      setStats(s)
      setAnalytics(a)
      setLoading(false)
    })
  }, [])
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-4 w-full"
    >
      {/* Header */}
      <PageHero 
        title={`Welcome back, ${user?.name || 'Faculty Member'}`}
        description="Manage your assigned classes and distribute academic resources."
        action={
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        }
      />

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Assigned Subjects', icon: BookOpen, value: stats?.subjects ?? '—', label: 'Active courses', link: '/teacher/subjects', trend: { value: 0, label: 'vs last month' } },
          { title: 'Total Resources', icon: FileText, value: stats?.notes ?? '—', label: 'Files distributed', link: '/teacher/notes', trend: { value: 12, label: 'this week' } },
          { title: 'Active Assignments', icon: Calendar, value: stats?.activeTasks ?? '—', label: `${stats?.dueThisWeekTasks ?? 0} due this week`, link: '/teacher/tasks' },
          { title: 'Total Views', icon: Eye, value: loading ? '—' : (analytics?.totalViews ?? 0), label: 'Resource opens', link: '/teacher/students', trend: { value: 45, label: 'vs last month' } },
        ].map(({ title, icon: Icon, value, label, link, trend }) => (
          <KpiCard 
            key={title}
            title={title}
            value={value}
            icon={Icon}
            subtitle={label}
            to={link}
            loading={loading}
            trend={trend}
          />
        ))}

      </motion.div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Primary Content: Analytics Row */}
        <motion.div variants={itemVariants} className="lg:col-span-2 h-full">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900 h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Resource Engagement</CardTitle>
                  <CardDescription>Performance across your distributed materials</CardDescription>
                </div>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : analytics?.mostViewed ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                  {/* Most viewed */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="p-4 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/[0.03] hover:bg-[#0F766E]/[0.06] transition-colors group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F766E] opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                        <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">Most Viewed</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-50"><AnimatedCounter value={analytics.mostViewed.views} suffix=" views" /></span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0F766E] transition-colors pl-1">{analytics.mostViewed.title}</p>
                  </motion.div>
                  
                  {/* Least viewed */}
                  {analytics.leastViewed && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors group relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Needs Attention</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-50"><AnimatedCounter value={analytics.leastViewed.views} suffix=" views" /></span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-800 transition-colors pl-1">{analytics.leastViewed.title}</p>
                    </motion.div>
                  )}
                  <Link to="/teacher/students" className="flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#0D6B64] mt-2 group">
                    View full analytics <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  </div>
                  
                  <div className="h-64 relative border-t border-slate-100 dark:border-slate-800 pt-6">
                    <TrendChart data={[
                      { date: 'Mon', views: 120 },
                      { date: 'Tue', views: 230 },
                      { date: 'Wed', views: 180 },
                      { date: 'Thu', views: 290 },
                      { date: 'Fri', views: 200 },
                      { date: 'Sat', views: 110 },
                      { date: 'Sun', views: 350 },
                    ]} />
                  </div>
                </div>
              ) : (
                <div className="py-6">
                  <EmptyState 
                    icon={BarChart3} 
                    title="No Resource Data" 
                    description="Upload and publish resources to see engagement metrics." 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Secondary Content: Recent Activity and Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900 h-full">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Student Activity</CardTitle>
                    <CardDescription className="text-xs">Latest resource accesses</CardDescription>
                  </div>
                  <Link to="/teacher/students" className="text-xs text-[#0F766E] font-medium hover:underline">View all</Link>
                </div>
              </CardHeader>
              <CardContent className="pt-3 px-3">
                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : analytics?.recentActivity?.length > 0 ? (
                  <div className="space-y-1">
                    {analytics.recentActivity.slice(0, 6).map((item, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors group relative"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0F766E]/5 border border-[#0F766E]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#0F766E]/10 transition-colors">
                          <span className="text-[10px] font-bold text-[#0F766E]">
                            {item.student?.substring(0,2)?.toUpperCase() || 'ST'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0F766E] transition-colors">{item.student}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.resource}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 pt-1">
                          <span className="text-[10px] text-slate-400 font-medium">{timeAgo(item.viewed_at)}</span>
                          {item.completed && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Users className="w-7 h-7 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">No student activity yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-3">
                {[
                  { title: 'My Subjects', desc: 'View assigned courses', icon: BookOpen, to: '/teacher/subjects' },
                  { title: 'My Students', desc: 'Track engagement', icon: Users, to: '/teacher/students' },
                  { title: 'Inbox', desc: 'Messages & Feedback', icon: MessageSquare, to: '/teacher/inbox' },
                  { title: 'My Resources', desc: 'Manage files', icon: FileText, to: '/teacher/notes' },
                ].map(({ title, desc, icon: Icon, to }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0F766E]/40 hover:bg-slate-50 dark:hover:bg-slate-950 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center group-hover:bg-[#0F766E]/10 transition-colors shrink-0 border border-slate-100 dark:border-slate-800 group-hover:scale-105 transform duration-300">
                      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-[#0F766E] transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0F766E] transition-colors">{title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{desc}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
