import React, { useEffect, useState, useMemo } from 'react'
import { Input } from '../ui/input'
import { Users, Search, ChevronLeft, ChevronRight, ArrowUpDown, CheckCircle2, Clock, BookOpen } from 'lucide-react'
import { teacher } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { PageHero, itemVariants, containerVariants, TableToolbar, TableSearch, TableEmptyState, SectionCard, TableSkeleton } from '../ui/design-system'
import { Pagination } from '../ui/pagination'
import KpiCard from '../ui/KpiCard'
import { AnimatePresence } from 'framer-motion'

function timeAgo(date) {
  if (!date) return 'No activity'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  useEffect(() => { loadStudents() }, [])

  async function loadStudents() {
    try {
      const data = await teacher.students()
      setStudents(data)
    } catch (err) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortOrder('asc') }
  }

  const { filtered, paginated, totalPages } = useMemo(() => {
    let result = [...students]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.section_id?.name?.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      let aVal, bVal
      if (sortField === 'section') { aVal = a.section_id?.name || ''; bVal = b.section_id?.name || '' }
      else if (sortField === 'completion_pct') { aVal = a.completion_pct || 0; bVal = b.completion_pct || 0 }
      else if (sortField === 'last_activity') { aVal = a.last_activity ? new Date(a.last_activity).getTime() : 0; bVal = b.last_activity ? new Date(b.last_activity).getTime() : 0 }
      else { aVal = a[sortField] || ''; bVal = b[sortField] || '' }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    const totalPages = Math.max(1, Math.ceil(result.length / itemsPerPage))
    const paginated = result.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    return { filtered: result, paginated, totalPages }
  }, [students, searchQuery, sortField, sortOrder, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  const SortTh = ({ field, children }) => (
    <th
      className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3 text-slate-400" />
      </div>
    </th>
  )

  // Summary stats
  const activeStudents = students.filter(s => s.last_activity && (Date.now() - new Date(s.last_activity).getTime()) < 7 * 24 * 60 * 60 * 1000).length
  const avgCompletion = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.completion_pct || 0), 0) / students.length) : 0

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 max-w-6xl pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">My Students</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track engagement and completion across your enrolled students.</p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <KpiCard 
          title="Total Students" 
          value={students.length} 
          icon={Users} 
          subtitle="In your classes" 
          trend={{ value: 5, label: 'new enrollees' }}
        />
        <KpiCard 
          title="Active This Week" 
          value={activeStudents} 
          icon={Clock} 
          subtitle="Recently engaged" 
          trend={{ value: 12, label: 'vs last week' }}
        />
        <KpiCard 
          title="Avg Completion" 
          value={loading ? '—' : avgCompletion} 
          suffix="%"
          icon={CheckCircle2} 
          subtitle="Across your resources" 
          trend={{ value: 2, label: 'steady progress' }}
        />
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or section..."
            />
            {!loading && (
              <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Showing {filtered.length} of {students.length} students
              </p>
            )}
          </TableToolbar>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <SortTh field="name">Student</SortTh>
                <SortTh field="section">Section</SortTh>
                <SortTh field="last_activity">Last Activity</SortTh>
                <SortTh field="resources_viewed">Resources Viewed</SortTh>
                <SortTh field="completion_pct">Completion</SortTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <TableSkeleton rows={5} columns={5} />
              ) : paginated.length === 0 ? (
                  <TableEmptyState 
                    colSpan="5"
                    icon={Users}
                    title="No Students Found"
                    description={searchQuery ? "Try a different search term." : "You do not have any students assigned yet."}
                  />
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginated.map((student, i) => (
                    <motion.tr 
                      key={student._id} 
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative"
                    >
                      {/* Student */}
                      <td className="px-5 py-3.5 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E] font-bold text-xs shrink-0">
                            {student.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{student.name}</div>
                            <div className="text-xs text-slate-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Section */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-200 font-medium text-xs">{student.section_id?.name || '—'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{student.branch_id?.code} · Sem {student.semester_id?.number}</div>
                      </td>
                      {/* Last Activity */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${student.last_activity && (Date.now() - new Date(student.last_activity).getTime()) < 7 * 24 * 60 * 60 * 1000 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-700 dark:text-slate-200">{timeAgo(student.last_activity)}</span>
                        </div>
                      </td>
                      {/* Resources Viewed */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{student.resources_viewed ?? 0}</span>
                        <span className="text-xs text-slate-400"> resources</span>
                      </td>
                      {/* Completion */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${(student.completion_pct || 0) >= 70 ? 'bg-emerald-500' : (student.completion_pct || 0) >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${student.completion_pct || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{student.completion_pct ?? 0}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
            </table>
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        </SectionCard>
      </motion.div>
    </motion.div>
  )
}
