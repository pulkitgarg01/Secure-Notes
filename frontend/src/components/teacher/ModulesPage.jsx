import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Plus, Trash2, Edit2, Folder, FolderOpen, Layers } from 'lucide-react'
import { teacher } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, Modal, Skeleton, itemVariants } from '../ui/design-system'
import { Select } from '../ui/select'
import { ActionContextMenu } from '../ui/ActionContextMenu'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ModulesPage() {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchParams] = useSearchParams()
  const initialSubject = searchParams.get('subject')
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || 'all')
  const [formData, setFormData] = useState({ title: '', description: '', subject_id: '', parent_id: '', order: 0 })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadModules()
    }
  }, [selectedSubject])

  async function loadData() {
    try {
      const subjectsData = await teacher.subjects()
      setSubjects(subjectsData)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function loadModules() {
    try {
      const params = selectedSubject !== 'all' ? { subject_id: selectedSubject } : {}
      const data = await teacher.modules.list(params)
      setModules(data)
    } catch (err) {
      toast.error('Failed to load modules')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        await teacher.modules.update(editing._id, formData)
        toast.success('Module updated')
      } else {
        await teacher.modules.create(formData)
        toast.success('Module created')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ title: '', description: '', subject_id: '', parent_id: '', order: 0 })
      loadModules()
    } catch (err) {
      toast.error(err.message || 'Failed to save module')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this module/folder?')) return
    try {
      await teacher.modules.delete(id)
      toast.success('Module deleted')
      loadModules()
    } catch (err) {
      toast.error(err.message || 'Failed to delete module')
    }
  }

  function startEdit(module) {
    setEditing(module)
    setFormData({
      title: module.title,
      description: module.description || '',
      subject_id: module.subject_id?._id || module.subject_id || '',
      parent_id: module.parent_id?._id || module.parent_id || '',
      order: module.order || 0
    })
    setShowForm(true)
  }

  const rootModules = modules.filter(m => !m.parent_id)
  const getChildModules = (parentId) => modules.filter(m => m.parent_id?._id === parentId || m.parent_id === parentId)

  return (
    <PageContainer>
      <PageHero 
        title="Modules & Folders" 
        description="Create and manage structure for your subjects"
        action={
          <Button onClick={() => { setShowForm(true); setEditing(null); setFormData({ title: '', description: '', subject_id: selectedSubject !== 'all' ? selectedSubject : (subjects[0]?._id || ''), parent_id: '', order: 0 }) }} className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Module
          </Button>
        }
      />

      <StatsGrid>
        <StatCard title="Total Modules" icon={Layers} value={modules.length} label="Structured folders" />
      </StatsGrid>

      {subjects.length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-slate-700 dark:text-slate-200 font-medium m-0 whitespace-nowrap">Filter by Subject</Label>
                <Select
                  className="w-full md:w-64"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 min-h-[300px]">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Folder className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No modules found</p>
                  <p className="text-sm text-slate-400 mt-1">Create your first module for this subject to start organizing content.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rootModules.map((module) => (
                    <ActionContextMenu 
                      key={module._id}
                      actions={[
                        { label: 'Edit', icon: Edit2, onSelect: () => startEdit(module) },
                        { label: 'View Notes', icon: Folder, onSelect: () => navigate(`/teacher/notes?module=${module._id}&subject=${module.subject_id?._id || selectedSubject}`) },
                        { separator: true },
                        { label: 'Delete', icon: Trash2, danger: true, onSelect: () => handleDelete(module._id) }
                      ]}
                    >
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between p-4 group">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => navigate(`/teacher/notes?module=${module._id}&subject=${module.subject_id?._id || selectedSubject}`)}
                        >
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Folder className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 transition-colors">{module.title}</div>
                            {module.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{module.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(module)} className="text-slate-400 hover:text-[#0F766E] hover:bg-[#0F766E]/10">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(module._id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Sub-modules */}
                      {getChildModules(module._id).length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 p-3 pl-12 space-y-2">
                          {getChildModules(module._id).map((child) => (
                            <ActionContextMenu 
                              key={child._id}
                              actions={[
                                { label: 'Edit', icon: Edit2, onSelect: () => startEdit(child) },
                                { label: 'View Notes', icon: FolderOpen, onSelect: () => navigate(`/teacher/notes?module=${child._id}&subject=${child.subject_id?._id || selectedSubject}`) },
                                { separator: true },
                                { label: 'Delete', icon: Trash2, danger: true, onSelect: () => handleDelete(child._id) }
                              ]}
                            >
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-[#0F766E]/30 transition-colors">
                                <div className="flex items-center gap-3">
                                <div className="text-slate-400">
                                  <FolderOpen className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{child.title}</div>
                                  {child.description && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{child.description}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => startEdit(child)} className="h-7 w-7 p-0 text-slate-400 hover:text-[#0F766E] hover:bg-[#0F766E]/10">
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(child._id)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            </ActionContextMenu>
                          ))}
                        </div>
                      )}
                    </div>
                    </ActionContextMenu>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>
      )}

      <Modal 
        isOpen={showForm} 
        onClose={() => { setShowForm(false); setEditing(null) }} 
        title={editing ? 'Edit Module' : 'Create Module/Folder'} 
        description="Organize subject resources into logical units."
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Title</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Description (Optional)</Label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Subject</Label>
                    <Select
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, parent_id: '' })}
                      required
                    >
                      {subjects.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Parent Folder (Optional)</Label>
                    <Select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    >
                      <option value="">None (Root level)</option>
                      {rootModules.filter(m => !formData.subject_id || m.subject_id?._id === formData.subject_id || m.subject_id === formData.subject_id).map(m => (
                        <option key={m._id} value={m._id}>{m.title}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">Order</Label>
                    <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="border-slate-300 dark:border-slate-700 focus:ring-[#0F766E]" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">{editing ? 'Save Changes' : 'Create Module'}</Button>
                  <Button type="button" variant="outline" className="border-slate-300 dark:border-slate-700" onClick={() => { setShowForm(false); setEditing(null) }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
      </Modal>
    </PageContainer>
  )
}
