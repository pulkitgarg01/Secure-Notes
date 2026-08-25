import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Trash2, UserCheck, BookOpen, FileText, Search, ArrowUpDown, Plus } from 'lucide-react'
import { admin, academic } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableFilter, TableEmptyState, Modal, itemVariants, TableSkeleton } from '../ui/design-system'
import { Pagination } from '../ui/pagination'
import { Select } from '../ui/select'

export default function SubjectAssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ teacher_id: '', subject_id: '' })
  const [showForm, setShowForm] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [sortField, setSortField] = useState('teacher')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [assignmentsData, usersData, subjectsData] = await Promise.all([
        admin.assignSubject.list(),
        admin.users.list({ role: 'teacher' }),
        academic.subjects.list()
      ])
      setAssignments(assignmentsData)
      setTeachers(usersData)
      setSubjects(subjectsData)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await admin.assignSubject.create(formData)
      toast.success('Subject assigned to teacher')
      setFormData({ teacher_id: '', subject_id: '' })
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to assign subject')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this assignment?')) return
    try {
      await admin.assignSubject.delete(id)
      toast.success('Assignment removed')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to remove assignment')
    }
  }

  const assignedSubjectIds = assignments.map(a => a.subject_id?._id || a.subject_id)
  const unassignedSubjects = subjects.filter(s => !assignedSubjectIds.includes(s._id)).length

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const { filteredAssignments, paginatedAssignments, totalPages } = useMemo(() => {
    let result = [...assignments]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a => 
        a.teacher_id?.name?.toLowerCase().includes(q) || 
        a.subject_id?.name?.toLowerCase().includes(q) ||
        a.subject_id?.code?.toLowerCase().includes(q)
      )
    }
    
    if (teacherFilter !== 'all') {
      result = result.filter(a => (a.teacher_id?._id || a.teacher_id) === teacherFilter)
    }

    result.sort((a, b) => {
      let aVal = a.teacher_id?.name || ''
      let bVal = b.teacher_id?.name || ''
      
      if (sortField === 'subject') {
        aVal = a.subject_id?.name || ''
        bVal = b.subject_id?.name || ''
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const totalPages = Math.ceil(result.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedAssignments = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredAssignments: result, paginatedAssignments, totalPages }
  }, [assignments, searchQuery, teacherFilter, sortField, sortOrder, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, teacherFilter])

  return (
    <PageContainer>
      <PageHero 
        title="Subject Assignments" 
        description="Delegate subject management to faculty"
        action={
          <Button className="bg-[#0F766E] hover:bg-[#0D6B64] text-white" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Assign Subject
          </Button>
        }
      />

      <div className="space-y-6">
        <StatsGrid>
          <StatCard title="Total Delegations" icon={FileText} value={assignments.length} label="Active assignments" />
          <StatCard title="Unassigned Subjects" icon={BookOpen} value={unassignedSubjects} label="Requires delegation" />
          <StatCard title="Active Faculty" icon={UserCheck} value={teachers.filter(t => t.status === 'active').length} label="Available for assignment" />
        </StatsGrid>

        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Assign Subject"
          description="Link a subject to a faculty member."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Faculty Member</Label>
                    <Select
                      value={formData.teacher_id}
                      onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                      required
                    >
                      <option value="">Select teacher</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Subject</Label>
                    <Select
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      required
                    >
                      <option value="">Select subject</option>
                      {subjects.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">Delegate Subject</Button>
                </div>
              </form>
        </Modal>

        <motion.div variants={itemVariants}>
          <SectionCard>
            <TableToolbar>
              <TableSearch 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assignments..."
              />
              <div className="flex gap-3 w-full md:w-auto">
                <TableFilter 
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Faculty' },
                    ...teachers.map(t => ({ value: t._id, label: t.name }))
                  ]}
                />
              </div>
            </TableToolbar>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                  <tr>
                    <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('teacher')}>
                      <div className="flex items-center gap-1">Faculty <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('subject')}>
                      <div className="flex items-center gap-1">Subject <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {loading ? (
                    <TableSkeleton rows={5} columns={3} />
                  ) : paginatedAssignments.length === 0 ? (
                    <TableEmptyState 
                      colSpan="3"
                      icon={FileText}
                      title="No Assignments Found"
                      description="There are no assignments matching your search."
                    />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {paginatedAssignments.map((assignment, i) => (
                        <motion.tr 
                          key={assignment._id} 
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative"
                        >
                          <td className="px-5 py-4 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3">
                              <Link to={`/admin/users?search=${encodeURIComponent(assignment.teacher_id?.name || '')}`} className="w-8 h-8 rounded-full bg-blue-50/50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm hover:ring-2 hover:ring-blue-400 transition-all">
                                {assignment.teacher_id?.name?.substring(0,2).toUpperCase() || <UserCheck className="w-4 h-4" />}
                              </Link>
                              <Link to={`/admin/users?search=${encodeURIComponent(assignment.teacher_id?.name || '')}`} className="font-semibold text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                {assignment.teacher_id?.name}
                              </Link>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-50">{assignment.subject_id?.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{assignment.subject_id?.code}</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment._id)} aria-label="Delete Assignment" className="text-slate-400 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
              totalItems={filteredAssignments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            />
          </SectionCard>
        </motion.div>
      </div>
    </PageContainer>
  )
}
