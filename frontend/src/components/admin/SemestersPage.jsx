import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Plus, Trash2, CalendarDays, Search, ArrowUpDown } from 'lucide-react'
import { academic } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableEmptyState, Modal, itemVariants, TableSkeleton } from '../ui/design-system'
import { Pagination } from '../ui/pagination'

export default function SemestersPage() {
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [number, setNumber] = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('number')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadSemesters()
  }, [])

  async function loadSemesters() {
    try {
      const data = await academic.semesters.list()
      setSemesters(data)
    } catch (err) {
      toast.error('Failed to load semesters')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await academic.semesters.create({ number: parseInt(number) })
      toast.success('Semester created')
      setShowForm(false)
      setNumber('')
      loadSemesters()
    } catch (err) {
      toast.error(err.message || 'Failed to create semester')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this semester?')) return
    try {
      await academic.semesters.delete(id)
      toast.success('Semester deleted')
      loadSemesters()
    } catch (err) {
      toast.error(err.message || 'Failed to delete semester')
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

  const { filteredSemesters, paginatedSemesters, totalPages } = useMemo(() => {
    let result = [...semesters]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => `semester ${s.number}`.includes(q) || s.number.toString().includes(q))
    }

    result.sort((a, b) => {
      let aVal = a[sortField] || 0
      let bVal = b[sortField] || 0
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const totalPages = Math.ceil(result.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedSemesters = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredSemesters: result, paginatedSemesters, totalPages }
  }, [semesters, searchQuery, sortField, sortOrder, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  return (
    <PageContainer>
      <PageHero 
        title="Semesters" 
        description="Content Organization Structure"
        action={
          <Button onClick={() => setShowForm(true)} className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Semester
          </Button>
        }
      />

      <StatsGrid>
        <StatCard title="Total Semesters" icon={CalendarDays} value={semesters.length} label="Active timelines" />
      </StatsGrid>

      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search semesters..."
            />
          </TableToolbar>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('number')}>
                    <div className="flex items-center gap-1">Semester <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {loading ? (
                    <TableSkeleton rows={5} columns={2} />
                  ) : paginatedSemesters.length === 0 ? (
                    <TableEmptyState 
                      colSpan="2"
                      icon={CalendarDays}
                      title="No Semesters Found"
                      description="There are no semesters matching your search."
                    />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {paginatedSemesters.map((sem, i) => (
                        <motion.tr 
                          key={sem._id} 
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-50 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="group-hover:text-[#0F766E] transition-colors">Semester {sem.number}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(sem._id)} aria-label="Delete Semester" className="text-slate-400 hover:text-red-600">
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
              totalItems={filteredSemesters.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            />
          </SectionCard>
      </motion.div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setNumber('') }}
        title="Create Semester"
        description="Define a new academic term period."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 max-w-sm">
                  <Label className="text-slate-700 dark:text-slate-200">Semester Number (1-8)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="8"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                    className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">Create Semester</Button>
                  <Button type="button" variant="outline" className="border-slate-300 dark:border-slate-700" onClick={() => { setShowForm(false); setNumber('') }}>
                    Cancel
                  </Button>
                </div>
        </form>
      </Modal>

    </PageContainer>
  )
}
