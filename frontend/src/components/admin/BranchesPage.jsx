import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Plus, Trash2, Edit2, Network, Search, ArrowUpDown } from 'lucide-react'
import { academic } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableEmptyState, Modal, itemVariants, TableSkeleton } from '../ui/design-system'
import { Pagination } from '../ui/pagination'

export default function BranchesPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  
  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({ name: '', code: '' })

  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    try {
      const data = await academic.branches.list()
      setBranches(data)
    } catch (err) {
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        await academic.branches.update(editing._id, formData)
        toast.success('Branch updated')
      } else {
        await academic.branches.create(formData)
        toast.success('Branch created')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', code: '' })
      loadBranches()
    } catch (err) {
      toast.error(err.message || 'Failed to save branch')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this branch?')) return
    try {
      await academic.branches.delete(id)
      toast.success('Branch deleted')
      loadBranches()
    } catch (err) {
      toast.error(err.message || 'Failed to delete branch')
    }
  }

  function startEdit(branch) {
    setEditing(branch)
    setFormData({ name: branch.name, code: branch.code })
    setShowForm(true)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Memoized table computations
  const { filteredBranches, paginatedBranches, totalPages } = useMemo(() => {
    let result = [...branches]
    
    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
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
    const paginatedBranches = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredBranches: result, paginatedBranches, totalPages }
  }, [branches, searchQuery, sortField, sortOrder, currentPage, itemsPerPage])

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  return (
    <PageContainer>
      <PageHero 
        title="Branches" 
        description="Content Organization Structure"
        action={
          <Button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', code: '' }) }} className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        }
      />

      <StatsGrid>
        <StatCard title="Total Branches" icon={Network} value={branches.length} label="Active domains" />
      </StatsGrid>

      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branches by name or code..."
            />
          </TableToolbar>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Branch Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('code')}>
                    <div className="flex items-center gap-1">Code <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {loading ? (
                    <TableSkeleton rows={5} columns={3} />
                  ) : paginatedBranches.length === 0 ? (
                    <TableEmptyState 
                      colSpan="3"
                      icon={Network}
                      title="No Branches Found"
                      description="There are no branches matching your search."
                    />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {paginatedBranches.map((branch, i) => (
                        <motion.tr 
                          key={branch._id} 
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-50 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="group-hover:text-[#0F766E] transition-colors">{branch.name}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">{branch.code}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEdit(branch)} aria-label="Edit Branch" className="text-slate-400 hover:text-[#0F766E]">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(branch._id)} aria-label="Delete Branch" className="text-slate-400 hover:text-red-600">
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
              totalItems={filteredBranches.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            />
          </SectionCard>
      </motion.div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Branch' : 'Create Branch'}
        description="Define the core academic domains of your institution."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Branch Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Computer Science"
                      required
                      className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Branch Code</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. CSE"
                      required
                      className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">{editing ? 'Save Changes' : 'Create Branch'}</Button>
                  <Button type="button" variant="outline" className="border-slate-300 dark:border-slate-700" onClick={() => { setShowForm(false); setEditing(null) }}>
                    Cancel
                  </Button>
                </div>
        </form>
      </Modal>

    </PageContainer>
  )
}
