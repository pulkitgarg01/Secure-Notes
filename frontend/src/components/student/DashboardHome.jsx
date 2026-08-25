import React, { useEffect, useState } from 'react'
import { BookOpen, FileText, ArrowRight, CheckCircle2, Clock, PlayCircle, Trophy, Sparkles, Megaphone, Calendar } from 'lucide-react'
import { student, communication } from '../../lib/api'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { containerVariants, itemVariants, Badge, Skeleton, cn } from '../ui/design-system'
import { Button } from '../ui/button'
import EmptyState from '../ui/EmptyState'

// Timeago utility
function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function DashboardHome() {
  const { auth } = useAuth()
  const user = auth?.user

  const [stats, setStats] = useState({ subjects: 0, completed: 0, total: 0 })
  const [recent, setRecent] = useState([])
  const [inProgress, setInProgress] = useState([])
  const [recommended, setRecommended] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, recentData, recommendedData, announcementsData, tasksData] = await Promise.all([
          student.stats().catch(() => null),
          student.recent(15).catch(() => []),
          student.recommended().catch(() => []),
          communication.announcements.list().catch(() => []),
          student.tasks.list().catch(() => [])
        ])
        
        setStats(statsData || { subjects: 0, completed: 0, total: 0 })
        
        const allRecent = recentData || []
        setInProgress(allRecent.filter(n => !n.progress?.completed).slice(0, 1)) // Just the most recent one for "Continue Learning"
        setRecent(allRecent.slice(0, 6))

        setRecommended(recommendedData || [])
        setAnnouncements(announcementsData || [])
        
        // Filter tasks to show only upcoming ones due soon (next 3)
        const activeTasks = (tasksData || []).filter(t => t.status === 'Active' && new Date(t.due_date) > new Date())
        setTasks(activeTasks.slice(0, 3))

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const continueItem = inProgress[0] || recent[0]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-8 w-full">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0F766E] text-white shadow-xl shadow-[#0F766E]/10">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white dark:bg-slate-900 opacity-5 blur-3xl mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#34D399] opacity-10 blur-3xl mix-blend-overlay" />
        
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-slate-900/10 border border-white/20 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-semibold tracking-wide text-emerald-50">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              Ready to crush your <br className="hidden md:block"/> learning goals today?
            </h1>
            <p className="text-emerald-100/80 max-w-md text-sm leading-relaxed">
              You are making great progress. Keep up the momentum and explore your recommended resources to master your subjects.
            </p>
          </div>
          
          {/* Circular Progress Overview */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-center p-6 bg-white/10 dark:bg-slate-900/20 rounded-2xl border border-white/20 backdrop-blur-md gap-6 sm:gap-8 shadow-inner">
            <div className="relative w-32 h-32 flex items-center justify-center">
               <svg viewBox="0 0 128 128" className="w-full h-full transform -rotate-90 overflow-visible">
                 <circle cx="64" cy="64" r="56" className="text-white/20 stroke-current" strokeWidth="12" fill="transparent" />
                 <motion.circle 
                   cx="64" cy="64" r="56" 
                   className="text-white stroke-current drop-shadow-md" 
                   strokeWidth="12" 
                   fill="transparent" 
                   strokeDasharray={351.85}
                   initial={{ strokeDashoffset: 351.85 }}
                   animate={{ strokeDashoffset: 351.85 - (351.85 * completionPercent) / 100 }}
                   transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute flex flex-col items-center justify-center text-center">
                 <span className="text-3xl font-black text-white drop-shadow-sm">{completionPercent}%</span>
               </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 shadow-sm"><BookOpen className="w-5 h-5 text-white"/></div>
                <div>
                  <p className="text-2xl font-black text-white leading-none drop-shadow-sm">{stats.subjects}</p>
                  <p className="text-[10px] text-white/80 uppercase tracking-wider mt-1 font-bold">Active Subjects</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 shadow-sm"><Trophy className="w-5 h-5 text-white"/></div>
                <div>
                  <p className="text-2xl font-black text-white leading-none drop-shadow-sm">{stats.completed}</p>
                  <p className="text-[10px] text-white/80 uppercase tracking-wider mt-1 font-bold">Resources Read</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Continue Learning */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Continue Learning</h2>
              <Link to="/student/recent" className="text-sm font-bold text-[#0F766E] hover:underline flex items-center gap-1 group">
                View history <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {loading ? (
              <Skeleton className="h-32 rounded-2xl w-full" />
            ) : continueItem ? (
              <Link to="/student/recent" state={{ autoOpenNote: continueItem }}>
                <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-sm hover:shadow-lg hover:border-[#0F766E]/30 transition-all overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0F766E]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0D6B64] shadow-inner flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                      <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <p className="text-[10px] font-black text-[#0F766E] uppercase tracking-widest mb-1.5">{continueItem.module_id?.title || 'Resource'}</p>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate mb-1 group-hover:text-[#0F766E] transition-colors">{continueItem.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Last viewed {timeAgo(continueItem.updated_at)}
                      </p>
                    </div>
                    <Button className="w-full sm:w-auto rounded-xl bg-[#0F766E] hover:bg-[#0D6B64] text-white shadow-md shadow-[#0F766E]/20 text-sm font-bold h-11 px-6">
                      Resume <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Link>
            ) : (
              <EmptyState icon={CheckCircle2} title="All caught up!" description="You have no resources currently in progress." />
            )}
          </motion.div>

          {/* Recommended Content */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Recommended for You</h2>
              <Badge variant="warning">New</Badge>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommended.length > 0 ? recommended.map((rec, i) => (
                <Link key={rec._id} to="/student/recent" state={{ autoOpenNote: rec }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-[#0F766E]/40 hover:shadow-xl hover:shadow-[#0F766E]/10 hover:-translate-y-1.5 transition-all cursor-pointer group relative overflow-hidden block">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F766E] to-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-4 group-hover:bg-[#0F766E]/10 group-hover:border-[#0F766E]/20 transition-colors shadow-sm">
                    {rec.file_type === 'video' ? <PlayCircle className="w-6 h-6 text-slate-400 group-hover:text-[#0F766E] transition-colors" /> : <FileText className="w-6 h-6 text-slate-400 group-hover:text-[#0F766E] transition-colors" />}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5 leading-snug group-hover:text-[#0F766E] transition-colors line-clamp-2">{rec.title}</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-5">{rec.subject_name || rec.module_id?.title}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-md"><Clock className="w-3.5 h-3.5 text-slate-400"/> {timeAgo(rec.created_at) || 'New'}</span>
                    <span className="text-xs font-bold text-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </Link>
              )) : (
                <div className="col-span-full">
                  <EmptyState icon={CheckCircle2} title="No Recommendations" description="You're all caught up! Browse subjects for more." />
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Resources Grid */}
          <motion.div variants={itemVariants}>
             <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-4">Recent Resources</h2>
             <div className="space-y-3">
                {recent.length > 0 ? (
                  recent.map((item, i) => (
                    <Link key={i} to="/student/recent" state={{ autoOpenNote: item }} className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-[#0F766E]/40 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0 group-hover:bg-[#0F766E]/10 transition-colors border border-slate-100 dark:border-slate-800 group-hover:border-[#0F766E]/20">
                         <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#0F766E] transition-colors" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0F766E] transition-colors">{item.title}</p>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mt-1 truncate">{item.module_id?.title || 'Unknown Module'}</p>
                      </div>
                      <div className="ml-4 flex flex-col items-end shrink-0 justify-center">
                        <span className="text-[11px] font-bold text-slate-400">{timeAgo(item.viewed_at)}</span>
                        {item.progress?.completed && <Badge variant="success" className="mt-1.5"><CheckCircle2 className="w-3 h-3"/> Completed</Badge>}
                      </div>
                      <div className="ml-4 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                         <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-[#0F766E]" />
                         </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <EmptyState icon={BookOpen} title="No recent resources" description="Start exploring your subjects to see history here." />
                  </div>
                )}
             </div>
          </motion.div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upcoming Deadlines Widget */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Deadlines</h2>
              </div>
              <Link to="/student/tasks" className="text-xs font-bold text-[#0F766E] hover:underline">View All</Link>
            </div>
            
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => {
                  const due = new Date(task.due_date);
                  const now = new Date();
                  const days = Math.round((new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={task._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{task.title}</p>
                        {task.submission ? (
                          <Badge className="shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Submitted
                          </Badge>
                        ) : (
                          <Badge className={`shrink-0 ${days <= 1 ? 'bg-orange-500 text-white' : days <= 3 ? 'bg-amber-500 text-white' : 'bg-slate-500/10 text-slate-500'}`}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{task.subject_id?.code}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-sm">
                No upcoming deadlines.
              </div>
            )}
          </motion.div>

          {announcements.length > 0 && (
            <motion.div variants={itemVariants} className="mb-6">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl shadow-sm p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Announcements</h2>
                </div>
                <div className="space-y-4">
                  {announcements.slice(0, 3).map(ann => (
                    <div key={ann._id} className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-emerald-500/10 shadow-sm">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{ann.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{ann.body}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(ann.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="sticky top-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-950 rounded-bl-full -z-10" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Activity Timeline</h2>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
              </div>
              
              <div className="relative">
                {/* Vertical Line with Fade */}
                <div className="absolute top-2 bottom-0 left-[11px] w-0.5 bg-gradient-to-b from-slate-200 dark:from-slate-700 via-slate-200 dark:via-slate-700 to-transparent" />
                
                <div className="space-y-8 relative pb-4">
                  {recent.slice(0, 6).map((activity, i) => (
                    <div key={i} className="flex gap-5 relative group cursor-default">
                      <div className="relative shrink-0 mt-0.5 z-10">
                        {i === 0 && (
                          <div className="absolute -inset-1.5 bg-[#0F766E]/20 rounded-full animate-ping opacity-75" />
                        )}
                        <div className={`w-6 h-6 rounded-full border-[4px] shadow-sm transition-all duration-300 relative z-10 ${i === 0 ? 'bg-white dark:bg-slate-900 border-[#0F766E]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-[#0F766E]/50'}`} />
                      </div>
                      <div>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1.5 transition-colors", i === 0 ? "text-[#0F766E]" : "text-slate-400 group-hover:text-slate-500")}>
                          {timeAgo(activity.viewed_at)}
                        </p>
                        <p className={cn("text-sm font-medium leading-snug", i === 0 ? "text-slate-900 dark:text-slate-50" : "text-slate-600 dark:text-slate-300")}>
                          Viewed <span className={cn("font-bold transition-colors", i === 0 ? "text-[#0F766E]" : "text-slate-900 dark:text-slate-50 group-hover:text-[#0F766E]")}>{activity.title}</span>
                        </p>
                        {activity.progress?.completed && (
                          <div className="mt-2">
                            <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> Marked as completed</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Account Creation Simulation */}
                  <div className="flex gap-5 relative">
                    <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800/50 border-[4px] border-slate-100 dark:border-slate-800 shrink-0 mt-0.5 relative z-10" />
                    <div>
                      <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1.5">A while ago</p>
                      <p className="text-sm font-bold text-slate-400 dark:text-slate-500 leading-snug">
                        Account created and enrolled
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
