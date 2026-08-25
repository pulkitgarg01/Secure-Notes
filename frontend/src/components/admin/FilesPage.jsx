import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, TableToolbar, TableSearch, TableFilter, TableEmptyState, itemVariants, Modal, TableSkeleton } from '../ui/design-system'
import { ArrowUpDown, FileText, Download, Trash2, Eye } from 'lucide-react'
import { admin } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import PDFViewerModal from '../PDFViewerModal'
import { Button } from '../ui/button'
import { Pagination } from '../ui/pagination'

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewFileId, setViewFileId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  
  // Sort
  const [sortField, setSortField] = useState('uploaded_at')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const data = await admin.notes.list()
      setFiles(data || [])
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await admin.notes.delete(id) 
      toast.success('Resource deleted successfully')
      fetchFiles()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete resource')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleSort = (field) => {
    setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc')
    setSortField(field)
  }

  const { filteredFiles, paginatedFiles, totalPages } = useMemo(() => {
    let result = [...files]

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f => 
        f.title?.toLowerCase().includes(q) || 
        f.description?.toLowerCase().includes(q) ||
        f.module_id?.subject_id?.name?.toLowerCase().includes(q) ||
        f.teacher_id?.name?.toLowerCase().includes(q)
      )
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(f => f.status === statusFilter)
    }

    // Apply Sort
    result.sort((a, b) => {
      let aVal, bVal
      switch(sortField) {
        case 'title':
          aVal = a.title?.toLowerCase() || ''
          bVal = b.title?.toLowerCase() || ''
          break
        case 'subject':
          aVal = a.module_id?.subject_id?.name?.toLowerCase() || ''
          bVal = b.module_id?.subject_id?.name?.toLowerCase() || ''
          break
        case 'faculty':
          aVal = a.teacher_id?.name?.toLowerCase() || ''
          bVal = b.teacher_id?.name?.toLowerCase() || ''
          break
        case 'views':
          aVal = a.views || 0
          bVal = b.views || 0
          break
        case 'uploaded_at':
          aVal = new Date(a.uploaded_at).getTime()
          bVal = new Date(b.uploaded_at).getTime()
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
    const paginatedFiles = result.slice(startIndex, startIndex + itemsPerPage)

    return { filteredFiles: result, paginatedFiles, totalPages }
  }, [files, searchQuery, statusFilter, sortField, sortOrder, currentPage, itemsPerPage])

  const publishedCount = files.filter(f => f.status === 'published').length
  const draftCount = files.filter(f => f.status === 'draft').length

  return (
    <PageContainer>
      <PageHero 
        title="Platform Files" 
        description="Monitor and manage all academic resources across the platform"
      />

      <StatsGrid>
        <StatCard title="Total Files" icon={FileText} value={files.length} label="Resources stored" />
        <StatCard title="Published" icon={Eye} value={publishedCount} label="Visible to students" />
        <StatCard title="Drafts" icon={FileText} value={draftCount} label="Pending publication" />
      </StatsGrid>

      <motion.div variants={itemVariants}>
        <SectionCard>
          <TableToolbar>
            <TableSearch 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject, or faculty..."
            />
            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <TableFilter 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'published', label: 'Published' },
                    { value: 'draft', label: 'Draft' }
                  ]}
                />
              </div>
            </div>
          </TableToolbar>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1">Resource Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('subject')}>
                    <div className="flex items-center gap-1">Subject & Module <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('faculty')}>
                    <div className="flex items-center gap-1">Faculty <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
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
                ) : paginatedFiles.length === 0 ? (
                  <TableEmptyState 
                    colSpan="6"
                    icon={FileText}
                    title="No Files Found"
                    description="There are no academic resources matching your criteria."
                  />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {paginatedFiles.map((file, i) => (
                      <motion.tr 
                        key={file._id} 
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors group relative"
                      >
                        <td className="px-5 py-4 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-[#0F766E] transition-colors">{file.title}</div>
                          {file.description && <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{file.description}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-800 dark:text-slate-100 font-medium text-xs group-hover:text-[#0F766E] transition-colors">{file.module_id?.subject_id?.code || 'N/A'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-slate-600 transition-colors">{file.module_id?.title}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-800 dark:text-slate-100 font-medium text-xs group-hover:text-[#0F766E] transition-colors">{file.teacher_id?.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{file.teacher_id?.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${
                            file.status === 'published' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {file.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-slate-700 dark:text-slate-200">{formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{file.views || 0} views</div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewFileId(file._id)} aria-label="View Document" className="text-slate-400 hover:text-indigo-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => window.open(`http://localhost:4000/api/admin/notes/${file._id}/view`, '_blank')} aria-label="Download Document" className="text-slate-400 hover:text-[#0F766E]">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(file._id)} aria-label="Delete Document" className="text-slate-400 hover:text-red-600">
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
            ) : paginatedFiles.length === 0 ? (
              <TableEmptyState 
                colSpan="1"
                icon={FileText}
                title="No Files Found"
                description="There are no files matching your criteria."
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {paginatedFiles.map((file, i) => (
                  <motion.div 
                    key={file._id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-50">{file.title}</div>
                        {file.description && <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{file.description}</div>}
                      </div>
                      <div className="shrink-0">
                        <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${
                          file.status === 'published' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {file.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col text-xs text-slate-500 gap-1 mt-1">
                       <div><span className="font-medium text-slate-700 dark:text-slate-300">Subject:</span> {file.module_id?.subject_id?.code || 'N/A'} - {file.module_id?.title}</div>
                       <div><span className="font-medium text-slate-700 dark:text-slate-300">Faculty:</span> {file.teacher_id?.name || 'Unknown'}</div>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500">
                        <div>{formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}</div>
                        <div>{file.views || 0} views</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewFileId(file._id)} aria-label="View Document" className="text-slate-400 hover:text-indigo-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => window.open(`http://localhost:4000/api/admin/notes/${file._id}/view`, '_blank')} aria-label="Download Document" className="text-slate-400 hover:text-[#0F766E]">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(file._id)} aria-label="Delete Document" className="text-slate-400 hover:text-red-600">
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
            totalItems={filteredFiles.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        </SectionCard>
      </motion.div>

      <PDFViewerModal 
        isOpen={!!viewFileId} 
        onClose={() => setViewFileId(null)} 
        fileId={viewFileId} 
        endpointPrefix="admin" 
      />

      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)} 
        title="Delete Resource"
        description="Are you sure you want to permanently delete this file? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(deleteConfirmId)}>
            Yes, Delete File
          </Button>
        </div>
      </Modal>
    </PageContainer>
  )
}
