import React, { useEffect, useState, useMemo } from 'react'
import { teacher } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { BookOpen, Search, ChevronLeft, ChevronRight, ArrowUpDown, Eye, Folder } from 'lucide-react'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableEmptyState, Skeleton, itemVariants } from '../ui/design-system'
import { ActionContextMenu } from '../ui/ActionContextMenu'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      const data = await teacher.subjects()
      setSubjects(data)
    } catch (err) {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const { filteredSubjects, paginatedSubjects, totalPages } = useMemo(() => {
    let result = [...subjects]
    
    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Pagination
    const totalPages = Math.ceil(result.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedSubjects = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredSubjects: result, paginatedSubjects, totalPages }
  }, [subjects, searchQuery, sortField, sortOrder, currentPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  return (
    <PageContainer>
      <PageHero 
        title="My Subjects" 
        description="Subjects assigned to you for content management"
      />

      <StatsGrid>
        <StatCard title="Assigned Subjects" icon={BookOpen} value={subjects.length} label="Active domains" />
      </StatsGrid>

      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned subjects by name or code..."
            />
          </TableToolbar>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Subject Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('code')}>
                    <div className="flex items-center gap-1">Code <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4">Branch & Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                    </tr>
                  ))
                ) : paginatedSubjects.length === 0 ? (
                  <TableEmptyState 
                    colSpan="3"
                    icon={BookOpen}
                    title="No Subjects Found"
                    description="There are no assigned subjects matching your search."
                  />
                ) : (
                  paginatedSubjects.map((subject, i) => (
                    <ActionContextMenu 
                      key={subject._id}
                      actions={[
                        { label: 'View Modules', icon: Folder, onSelect: () => navigate(`/teacher/modules?subject=${subject._id}`) },
                        { separator: true },
                        { label: 'View Students', icon: Eye, onSelect: () => navigate(`/teacher/students`) }
                      ]}
                    >
                      <motion.tr 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        onClick={() => navigate(`/teacher/modules?subject=${subject._id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative cursor-pointer"
                      >
                        <td className="px-5 py-4 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-[#0F766E] transition-colors">{subject.name}</div>
                          {subject.description && <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{subject.description}</div>}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{subject.code}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{subject.branch_id?.name}</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Sem {subject.semester_id?.number}</span>
                          </div>
                        </td>
                      </motion.tr>
                    </ActionContextMenu>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {!loading && paginatedSubjects.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-medium text-slate-700 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredSubjects.length)}</span> of <span className="font-medium text-slate-700 dark:text-slate-200">{filteredSubjects.length}</span> subjects
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" className="h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      </motion.div>
    </PageContainer>
  )
}
