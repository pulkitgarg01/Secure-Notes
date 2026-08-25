import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Plus, Trash2, Edit2, FileText, Search, ArrowUpDown, Filter, Upload, FileUp, Eye, Download } from 'lucide-react'
import { teacher } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableFilter, TableEmptyState, Modal, itemVariants, TableSkeleton } from '../ui/design-system'
import { Pagination } from '../ui/pagination'
import { Select } from '../ui/select'
import PDFViewerModal from '../PDFViewerModal'
import { useSearchParams } from 'react-router-dom'

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewFileId, setViewFileId] = useState(null)
  
  // Filters and Table state
  const [searchParams] = useSearchParams()
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all')
  const [selectedModule, setSelectedModule] = useState(searchParams.get('module') || 'all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('uploaded_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({ title: '', description: '', module_id: '', order: 0, status: 'draft' })
  const [file, setFile] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSubject !== 'all') {
      loadModules(selectedSubject)
    } else {
      loadModules() // Loads all modules
      setSelectedModule('all')
    }
    loadNotes()
  }, [selectedSubject, selectedModule])

  async function loadData() {
    try {
      const subjectsData = await teacher.subjects()
      setSubjects(subjectsData)
      loadNotes()
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function loadModules(subjectId) {
    try {
      const params = {}
      if (subjectId && subjectId !== 'all') {
        params.subject_id = subjectId
      }
      const data = await teacher.modules.list(params)
      setModules(data)
    } catch (err) {
      toast.error('Failed to load modules')
    }
  }

  async function loadNotes() {
    try {
      const params = {}
      if (selectedSubject !== 'all') params.subject_id = selectedSubject
      if (selectedModule !== 'all') params.module_id = selectedModule
      const data = await teacher.notes.list(params)
      setNotes(data)
    } catch (err) {
      toast.error('Failed to load notes')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file && !editing) {
      toast.error('Please select a PDF file')
      return
    }
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description || '')
      formDataToSend.append('module_id', formData.module_id)
      formDataToSend.append('order', formData.order || 0)
      formDataToSend.append('status', formData.status || 'draft')
      if (file) formDataToSend.append('file', file)

      if (editing) {
        await teacher.notes.update(editing._id, { title: formData.title, description: formData.description, order: formData.order, status: formData.status })
        toast.success('Resource updated')
      } else {
        await teacher.notes.upload(formDataToSend)
        toast.success('Resource uploaded')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ title: '', description: '', module_id: '', order: 0, status: 'draft' })
      setFile(null)
      loadNotes()
    } catch (err) {
      toast.error(err.message || 'Failed to save resource')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this resource?')) return
    try {
      await teacher.notes.delete(id)
      toast.success('Resource deleted')
      loadNotes()
    } catch (err) {
      toast.error(err.message || 'Failed to delete resource')
    }
  }

  function startEdit(note) {
    setEditing(note)
    
    // Make sure we have the modules loaded for this subject before editing
    const noteSubjectId = note.module_id?.subject_id?._id || note.module_id?.subject_id
    if (noteSubjectId && noteSubjectId !== selectedSubject) {
      loadModules(noteSubjectId)
    }
    
    setFormData({
      title: note.title,
      description: note.description || '',
      module_id: note.module_id?._id || note.module_id,
      order: note.order || 0,
      status: note.status || 'draft'
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

  const { filteredNotes, paginatedNotes, totalPages } = useMemo(() => {
    let result = [...notes]
    
    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q))
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(n => n.status === statusFilter)
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal
      
      switch (sortField) {
        case 'title':
          aVal = a.title?.toLowerCase() || ''
          bVal = b.title?.toLowerCase() || ''
          break
        case 'subject':
          aVal = a.module_id?.subject_id?.name?.toLowerCase() || ''
          bVal = b.module_id?.subject_id?.name?.toLowerCase() || ''
          break
        case 'uploaded_at':
          aVal = new Date(a.uploaded_at).getTime()
          bVal = new Date(b.uploaded_at).getTime()
          break
        case 'status':
          aVal = a.status || 'draft'
          bVal = b.status || 'draft'
          break
        default:
          aVal = a[sortField] || ''
          bVal = b[sortField] || ''
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Pagination
    const totalPages = Math.ceil(result.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedNotes = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredNotes: result, paginatedNotes, totalPages }
  }, [notes, searchQuery, statusFilter, sortField, sortOrder, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter, selectedSubject, selectedModule])

  const publishedCount = notes.filter(n => n.status === 'published').length
  const draftCount = notes.filter(n => n.status === 'draft').length

  return (
    <PageContainer>
      <PageHero 
        title="My Resources" 
        description="Upload and distribute academic resources"
        action={
          <Button onClick={() => { setShowForm(true); setEditing(null); setFormData({ title: '', description: '', module_id: selectedModule !== 'all' ? selectedModule : '', order: 0 }); setFile(null) }} className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
            <FileUp className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        }
      />

      <StatsGrid>
        <StatCard title="Total Resources" icon={FileText} value={notes.length} label="Files managed" />
        <StatCard title="Published" icon={FileText} value={publishedCount} label="Visible to students" />
        <StatCard title="Drafts" icon={Edit2} value={draftCount} label="Pending publication" />
      </StatsGrid>

      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
            />
            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <TableFilter 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'published', label: 'Published' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'archived', label: 'Archived' }
                  ]}
                />
                <TableFilter 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Subjects' },
                    ...subjects.map(s => ({ value: s._id, label: s.code }))
                  ]}
                />
                
                {selectedSubject !== 'all' && modules.length > 0 && (
                  <TableFilter 
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Modules' },
                      ...modules.map(m => ({ value: m._id, label: m.title }))
                    ]}
                  />
                )}
              </div>
            </div>
          </TableToolbar>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1">Resource Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('subject')}>
                    <div className="flex items-center gap-1">Subject & Module <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('views')}>
                    <div className="flex items-center gap-1">Views <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('uploaded_at')}>
                    <div className="flex items-center gap-1">Uploaded <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {loading ? (
                    <TableSkeleton rows={5} columns={6} />
                  ) : paginatedNotes.length === 0 ? (
                    <TableEmptyState 
                      colSpan="6"
                      icon={FileText}
                      title="No Resources Found"
                      description="No resources match your filters. Try adjusting your search."
                    />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {paginatedNotes.map((note, i) => (
                        <motion.tr 
                          key={note._id} 
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors group"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-50">{note.title}</div>
                            {note.description && <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{note.description}</div>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-slate-800 dark:text-slate-100 font-medium text-xs">{note.module_id?.subject_id?.code || 'N/A'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{note.module_id?.title}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              note.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                              note.status === 'archived' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {note.status ? note.status.charAt(0).toUpperCase() + note.status.slice(1) : 'Draft'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                              <span>{note.views ?? 0}</span>
                            </div>
                            {note.last_accessed && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Last: {new Date(note.last_accessed).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                            {new Date(note.uploaded_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewFileId(note._id)} aria-label="View Document" className="text-slate-400 hover:text-indigo-600" title="View Document">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => window.open(`http://localhost:4000/api/teacher/notes/${note._id}/view`, '_blank')} aria-label="Download Document" className="text-slate-400 hover:text-[#0F766E]" title="Download Document">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => startEdit(note)} aria-label="Edit Resource" className="text-slate-400 hover:text-[#0F766E]">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(note._id)} aria-label="Delete Resource" className="text-slate-400 hover:text-red-600">
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
              totalItems={filteredNotes.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            />
        </SectionCard>
      </motion.div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); setFile(null) }}
        title={editing ? 'Edit Resource' : 'Upload Resource'}
        description="Distribute a secure document to your students."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Resource Title</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Description (Optional)</Label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Target Module</Label>
                    <Select
                      value={formData.module_id}
                      onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                      required
                      disabled={modules.length === 0}
                    >
                      <option value="">Select module</option>
                      {modules.map(m => (
                        <option key={m._id} value={m._id}>{m.title} ({m.subject_id?.code || 'Subject'})</option>
                      ))}
                    </Select>
                    {modules.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">You need to create a Module (Folder) first before uploading resources.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Order</Label>
                    <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Status</Label>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="draft">Draft (Hidden from students)</option>
                      <option value="published">Published (Visible to students)</option>
                      <option value="archived">Archived (Read-only)</option>
                    </Select>
                  </div>
                </div>

                {!editing && (
                  <div className="space-y-2 max-w-md">
                    <Label className="text-slate-700 dark:text-slate-200">PDF File</Label>
                    <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required={!editing} className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">{editing ? 'Save Changes' : 'Upload File'}</Button>
                  <Button type="button" variant="outline" className="border-slate-300 dark:border-slate-700" onClick={() => { setShowForm(false); setEditing(null); setFile(null) }}>
                    Cancel
                  </Button>
                </div>
        </form>
      </Modal>

      <PDFViewerModal 
        isOpen={!!viewFileId} 
        onClose={() => setViewFileId(null)} 
        fileId={viewFileId} 
        endpointPrefix="teacher" 
      />
    </PageContainer>
  )
}
