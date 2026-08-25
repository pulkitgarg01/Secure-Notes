import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Plus, Trash2, Edit2, Users, Search, ArrowUpDown } from 'lucide-react'
import { admin, academic } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableFilter, TableEmptyState, Modal, itemVariants, SegmentedControl, Badge, TableSkeleton } from '../ui/design-system'
import { Pagination } from '../ui/pagination'
import { Select } from '../ui/select'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [semesters, setSemesters] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const { auth } = useAuth()
  
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'student'
  
  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState(initialRole)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student', status: 'active',
    branch_id: '', semester_id: '', section_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [usersData, branchesData, semestersData, sectionsData] = await Promise.all([
        admin.users.list(),
        academic.branches.list(),
        academic.semesters.list(),
        academic.sections.list()
      ])
      setUsers(usersData)
      setBranches(branchesData)
      setSemesters(semestersData)
      setSections(sectionsData)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        await admin.users.update(editing._id, formData)
        toast.success('User updated')
      } else {
        await admin.users.create(formData)
        toast.success('User created')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', email: '', password: '', role: 'student', status: 'active', branch_id: '', semester_id: '', section_id: '' })
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to save user')
    }
  }

  async function handleDelete(id) {
    try {
      await admin.users.delete(id)
      toast.success('User deleted successfully')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  function confirmDelete(id) {
    if (auth?.user?._id === id || auth?.user?.id === id) {
      toast.error('You cannot delete your own account.')
      return
    }
    setDeleteConfirmId(id)
  }

  function startEdit(user) {
    setEditing(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status || 'active',
      branch_id: user.branch_id?._id || user.branch_id || '',
      semester_id: user.semester_id?._id || user.semester_id || '',
      section_id: user.section_id?._id || user.section_id || ''
    })
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
  const { filteredUsers, paginatedUsers, totalPages } = useMemo(() => {
    let result = [...users]
    
    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter)
    }
    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter)
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      if (sortField === 'last_active') {
        aVal = new Date(a.last_active).getTime() || 0
        bVal = new Date(b.last_active).getTime() || 0
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Pagination
    const totalPages = Math.ceil(result.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedUsers = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredUsers: result, paginatedUsers, totalPages }
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortOrder, currentPage])

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, roleFilter, statusFilter])

  const filteredSections = sections.filter(s => 
    (!formData.branch_id || s.branch_id?._id === formData.branch_id || s.branch_id === formData.branch_id) &&
    (!formData.semester_id || s.semester_id?._id === formData.semester_id || s.semester_id === formData.semester_id)
  )

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <Badge variant="success">Active</Badge>
      case 'suspended': return <Badge variant="danger">Suspended</Badge>
      case 'inactive': return <Badge variant="default">Inactive</Badge>
      default: return null
    }
  }

  return (
    <PageContainer>
      <PageHero 
        title="Users" 
        description="Manage platform identities and permissions"
        action={
          <Button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', email: '', password: '', role: 'student', status: 'active', branch_id: '', semester_id: '', section_id: '' }) }} className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />

      <StatsGrid>
        <StatCard title="Total Users" icon={Users} value={users.filter(u => u.status === 'active').length} label="Active identities" />
        <StatCard title="Active Faculty" icon={Users} value={users.filter(u => u.role === 'teacher' && u.status === 'active').length} label="Instructors" />
        <StatCard title="Active Students" icon={Users} value={users.filter(u => u.role === 'student' && u.status === 'active').length} label="Learners" />
      </StatsGrid>

      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
            />
            <SegmentedControl 
              activeTab={roleFilter}
              onChange={setRoleFilter}
              tabs={[
                { id: 'all', label: 'All Users' },
                { id: 'student', label: 'Students' },
                { id: 'teacher', label: 'Faculty' },
                { id: 'admin', label: 'Admins' }
              ]}
            />
            <div className="flex gap-3 w-full md:w-auto">
              <TableFilter 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
              />
            </div>
          </TableToolbar>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4">Role / Details</th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('last_active')}>
                    <div className="flex items-center gap-1">Last Active <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <TableSkeleton rows={5} columns={5} />
                ) : paginatedUsers.length === 0 ? (
                  <TableEmptyState 
                    colSpan="5"
                    icon={Users}
                    title="No Users Found"
                    description="There are no users matching your current criteria."
                  />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {paginatedUsers.map((u, i) => (
                      <motion.tr 
                        key={u._id} 
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
                            <div className="w-9 h-9 rounded-full bg-[#0F766E]/5 border border-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0F766E]/10 transition-colors">
                              {u.name.substring(0,2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0F766E] transition-colors">{u.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="capitalize font-medium text-slate-700 dark:text-slate-200">{u.role}</span>
                          {u.role !== 'admin' && (u.branch_id || u.semester_id || u.section_id) && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {u.branch_id && <span>{u.branch_id.code}</span>}
                              {u.semester_id && <span>• S{u.semester_id.number}</span>}
                              {u.section_id && <span>• Sec {u.section_id.name}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">{getStatusBadge(u.status || 'active')}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {u.last_active ? formatDistanceToNow(new Date(u.last_active), { addSuffix: true }) : 'Never'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(u)} aria-label="Edit User" className="text-slate-400 hover:text-[#0F766E]">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(u._id)} aria-label="Delete User" className="text-slate-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
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

          {/* Mobile Card Layout */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableSkeleton rows={5} columns={1} />
            ) : paginatedUsers.length === 0 ? (
              <TableEmptyState 
                colSpan="1"
                icon={Users}
                title="No Users Found"
                description="There are no users matching your criteria."
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {paginatedUsers.map((u, i) => (
                  <motion.div 
                    key={u._id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#0F766E]/5 border border-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold text-sm shrink-0">
                          {u.name.substring(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {getStatusBadge(u.status || 'active')}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-col">
                        <span className="capitalize font-medium text-sm text-slate-700 dark:text-slate-200">{u.role}</span>
                        {u.role !== 'admin' && (u.branch_id || u.semester_id || u.section_id) && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            {u.branch_id && <span>{u.branch_id.code}</span>}
                            {u.semester_id && <span>• S{u.semester_id.number}</span>}
                            {u.section_id && <span>• Sec {u.section_id.name}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(u)} aria-label="Edit User" className="text-slate-400 hover:text-[#0F766E]">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(u._id)} aria-label="Delete User" className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />

        </SectionCard>
      </motion.div>

      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)} 
        title="Delete User"
        description="Are you sure you want to permanently delete this user? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(deleteConfirmId)}>
            Yes, Delete User
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit User Profile' : 'Provision New User'}
        description="Fill out the details below to manage this identity."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Full Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Email Address</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  {!editing && (
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-200">Password</Label>
                      <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">System Role</Label>
                    <Select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Account Status</Label>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </Select>
                  </div>
                </div>

                {(formData.role === 'student' || formData.role === 'teacher') && (
                  <div className="grid gap-6 md:grid-cols-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-200">Branch</Label>
                      <Select
                        value={formData.branch_id}
                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value, section_id: '' })}
                      >
                        <option value="">Select branch</option>
                        {branches.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-200">Semester</Label>
                      <Select
                        value={formData.semester_id}
                        onChange={(e) => setFormData({ ...formData, semester_id: e.target.value, section_id: '' })}
                      >
                        <option value="">Select semester</option>
                        {semesters.map(s => (
                          <option key={s._id} value={s._id}>{`Sem ${s.number}`}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-200">Section</Label>
                      <Select
                        value={formData.section_id}
                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                        disabled={!formData.branch_id || !formData.semester_id}
                      >
                        <option value="">Select section</option>
                        {filteredSections.map(s => (
                          <option key={s._id} value={s._id}>Section {s.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">{editing ? 'Save Changes' : 'Provision User'}</Button>
                  <Button type="button" variant="outline" className="border-slate-300 dark:border-slate-700" onClick={() => { setShowForm(false); setEditing(null) }}>
                    Cancel
                  </Button>
                </div>
              </form>
      </Modal>

    </PageContainer>
  )
}
