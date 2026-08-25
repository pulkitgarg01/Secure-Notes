import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Plus, Trash2, Users2, Search, ArrowUpDown } from 'lucide-react'
import { academic } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableFilter, TableEmptyState, Modal, itemVariants, TableSkeleton } from '../ui/design-system'
import { Pagination } from '../ui/pagination'
import { Select } from '../ui/select'

export default function SectionsPage() {
  const [sections, setSections] = useState([])
  const [branches, setBranches] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({ name: '', branch_id: '', semester_id: '' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [sectionsData, branchesData, semestersData] = await Promise.all([
        academic.sections.list(),
        academic.branches.list(),
        academic.semesters.list()
      ])
      setSections(sectionsData)
      setBranches(branchesData)
      setSemesters(semestersData)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await academic.sections.create(formData)
      toast.success('Section created')
      setShowForm(false)
      setFormData({ name: '', branch_id: '', semester_id: '' })
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to create section')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this section?')) return
    try {
      await academic.sections.delete(id)
      toast.success('Section deleted')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete section')
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

  const { filteredSections, paginatedSections, totalPages } = useMemo(() => {
    let result = [...sections]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q))
    }
    if (branchFilter !== 'all') {
      result = result.filter(s => (s.branch_id?._id || s.branch_id) === branchFilter)
    }

    result.sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const totalPages = Math.ceil(result.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedSections = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredSections: result, paginatedSections, totalPages }
  }, [sections, searchQuery, branchFilter, sortField, sortOrder, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, branchFilter])

  return (
    <PageContainer>
      <PageHero 
        title="Sections" 
        description="Content Organization Structure"
        action={
          <Button onClick={() => setShowForm(true)} className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        }
      />

      <StatsGrid>
        <StatCard title="Total Sections" icon={Users2} value={sections.length} label="Active student groups" />
      </StatsGrid>

      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections by name..."
            />
            <div className="flex gap-3 w-full md:w-auto">
              <TableFilter 
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Branches' },
                  ...branches.map(b => ({ value: b._id, label: b.name }))
                ]}
              />
            </div>
          </TableToolbar>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Section Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4">Branch & Semester</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {loading ? (
                    <TableSkeleton rows={5} columns={3} />
                  ) : paginatedSections.length === 0 ? (
                    <TableEmptyState 
                      colSpan="3"
                      icon={Users2}
                      title="No Sections Found"
                      description="There are no sections matching your search."
                    />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {paginatedSections.map((section, i) => (
                        <motion.tr 
                          key={section._id} 
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-50 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="group-hover:text-[#0F766E] transition-colors">Section {section.name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{section.branch_id?.name}</span>
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Sem {section.semester_id?.number}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(section._id)} aria-label="Delete Section" className="text-slate-400 hover:text-red-600">
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
              totalItems={filteredSections.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            />
          </SectionCard>
        </motion.div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setFormData({ name: '', branch_id: '', semester_id: '' }) }}
        title="Create Section"
        description="Define a new student cohort for a specific branch and semester."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Section Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. A, B, C"
                      required
                      className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Branch</Label>
                    <Select
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Semester</Label>
                    <Select
                      value={formData.semester_id}
                      onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                      required
                    >
                      <option value="">Select semester</option>
                      {semesters.map(s => (
                        <option key={s._id} value={s._id}>Semester {s.number}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">Create Section</Button>
                  <Button type="button" variant="outline" className="border-slate-300 dark:border-slate-700" onClick={() => { setShowForm(false); setFormData({ name: '', branch_id: '', semester_id: '' }) }}>
                    Cancel
                  </Button>
                </div>
        </form>
      </Modal>

    </PageContainer>
  )
}
