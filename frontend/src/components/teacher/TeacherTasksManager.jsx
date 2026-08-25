import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, Clock, FileText, Download, Eye, Users } from 'lucide-react'
import { teacher, downloadSecureFile, viewSecureFile } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { PageContainer, PageHero, StatCard, StatsGrid, SectionCard, Modal, Skeleton, itemVariants, Badge } from '../ui/design-system'
import { Select } from '../ui/select'
import { ActionContextMenu } from '../ui/ActionContextMenu'

export default function TeacherTasksManager() {
  const [tasks, setTasks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  
  const [formData, setFormData] = useState({ 
    title: '', description: '', subject_id: '', due_date: '', priority: 'Medium', status: 'Active' 
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTasks()
  }, [selectedSubject, selectedStatus])

  async function loadData() {
    try {
      const subjectsData = await teacher.subjects()
      setSubjects(subjectsData)
    } catch (err) {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  async function loadTasks() {
    try {
      let params = {}
      if (selectedSubject !== 'all') params.subject_id = selectedSubject
      if (selectedStatus !== 'all') params.status = selectedStatus
      
      const data = await teacher.tasks.list(params)
      setTasks(data)
    } catch (err) {
      toast.error('Failed to load tasks')
    }
  }

  function resetForm() {
    setFormData({ title: '', description: '', subject_id: '', due_date: '', priority: 'Medium', status: 'Active' })
    setEditing(null)
    setShowForm(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        await teacher.tasks.update(editing._id, formData)
        toast.success('Task updated')
      } else {
        await teacher.tasks.create(formData)
        toast.success('Task created')
      }
      resetForm()
      loadTasks()
    } catch (err) {
      toast.error(err.message || 'Error saving task')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await teacher.tasks.delete(id)
      toast.success('Task deleted')
      loadTasks()
    } catch (err) {
      toast.error(err.message || 'Error deleting task')
    }
  }

  function openEdit(task) {
    setEditing(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      subject_id: task.subject_id?._id || task.subject_id,
      due_date: new Date(task.due_date).toISOString().slice(0, 16),
      priority: task.priority,
      status: task.status
    })
    setShowForm(true)
  }

  const priorityColors = {
    Low: 'bg-emerald-500/10 text-emerald-500',
    Medium: 'bg-amber-500/10 text-amber-500',
    High: 'bg-rose-500/10 text-rose-500'
  }

  async function handleViewSubmissions(task) {
    setActiveTask(task)
    setShowSubmissions(true)
    setLoadingSubmissions(true)
    try {
      const data = await teacher.tasks.getSubmissions(task._id)
      setSubmissions(data)
    } catch (err) {
      toast.error('Failed to load submissions')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  async function handleDownloadSubmission(sub) {
    try {
      await downloadSecureFile(teacher.tasks.downloadSubmissionUrl(sub._id), sub.file_name)
    } catch(err) {
      toast.error('Download failed: ' + err.message)
    }
  }

  async function handleViewFile(sub) {
    try {
      await viewSecureFile(teacher.tasks.viewSubmissionUrl(sub._id), sub.file_name?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
    } catch(err) {
      toast.error('Failed to view file: ' + err.message)
    }
  }

  const groupedSubmissions = Object.values(
    submissions.reduce((acc, sub) => {
      const studentId = sub.student_id?._id || sub.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: sub.student_id,
          versions: []
        };
      }
      acc[studentId].versions.push(sub);
      return acc;
    }, {})
  );

  return (
    <PageContainer>
      <PageHero 
        icon={CalendarIcon}
        title="Assignments & Deadlines" 
        subtitle="Manage upcoming tasks for your students"
        action={
          <Button onClick={() => setShowForm(true)} className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
            <Plus className="w-4 h-4 mr-2" /> Create Assignment
          </Button>
        }
      />

      <div className="flex gap-4 mb-6">
        <div className="w-64">
          <Label className="text-xs mb-1 text-slate-500">Filter by Subject</Label>
          <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.subject_id?._id || s._id} value={s.subject_id?._id || s._id}>
                {s.subject_id?.code || s.code} - {s.subject_id?.name || s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-xs mb-1 text-slate-500">Filter by Status</Label>
          <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </Select>
        </div>
      </div>

      <SectionCard>
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 px-6">
            No assignments found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50 px-6">
            {tasks.map((task) => (
              <motion.div key={task._id} variants={itemVariants} className="flex items-center justify-between py-4 group">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-50">{task.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {task.subject_id?.code} - {task.subject_id?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {new Date(task.due_date).toLocaleString()}
                    </span>
                    <Badge className={priorityColors[task.priority]}>{task.priority} Priority</Badge>
                    {task.status === 'Archived' && <Badge className="bg-slate-500/10 text-slate-500">Archived</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {task.submissionCount > 0 && (
                    <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                      {task.submissionCount} / {task.enrolledCount > 0 ? task.enrolledCount : '-'} Submitted
                    </Badge>
                  )}
                  
                  <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(task)} className="shrink-0 text-slate-600">
                    <Users className="w-4 h-4 mr-2" />
                    View Submissions
                  </Button>

                  <ActionContextMenu
                    actions={[
                      { label: 'Edit', icon: Edit2, onClick: () => openEdit(task) },
                      { label: 'Delete', icon: Trash2, onClick: () => handleDelete(task._id), danger: true }
                    ]}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal isOpen={showForm} onClose={resetForm} title={editing ? "Edit Assignment" : "New Assignment"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Select 
              value={formData.subject_id} 
              onChange={e => setFormData({...formData, subject_id: e.target.value})}
              required
            >
              <option value="">Select subject...</option>
              {subjects.map(s => (
                <option key={s.subject_id?._id || s._id} value={s.subject_id?._id || s._id}>
                  {s.subject_id?.code || s.code} - {s.subject_id?.name || s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
              placeholder="E.g., Lab Report 1"
            />
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Input 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Enter instructions"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Input 
                type="datetime-local" 
                value={formData.due_date} 
                onChange={e => setFormData({...formData, due_date: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button type="submit" className="bg-[#0F766E] hover:bg-[#0D6B64] text-white">
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showSubmissions} onClose={() => setShowSubmissions(false)} title={`Submissions: ${activeTask?.title || ''}`} className="max-w-3xl">
        {loadingSubmissions ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No submissions yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {groupedSubmissions.map((group) => (
              <div key={group.student?._id || 'unknown'} className="py-4">
                <div className="mb-3">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{group.student?.name || 'Unknown Student (Deleted)'}</h4>
                  <p className="text-xs text-slate-500">{group.student?.usn || group.student?.email || 'No email available'}</p>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                  {group.versions.map((sub) => (
                    <div key={sub._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                      <div className="min-w-0 flex items-center gap-3 text-xs">
                        <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">v{sub.version}</span>
                        <span className={`shrink-0 font-medium ${sub.status === 'Late' ? 'text-rose-500' : 'text-emerald-500'}`}>{sub.status}</span>
                        <span className="text-slate-400 text-[10px] hidden sm:inline-block">({new Date(sub.submitted_at || Date.now()).toLocaleString()})</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleViewFile(sub)} className="h-7 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadSubmission(sub)} className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageContainer>
  )
}
