import React, { useEffect, useState } from 'react'
import { PageContainer, PageHero, SectionCard, Badge, Skeleton, itemVariants, Modal } from '../ui/design-system'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Calendar as CalendarIcon, Clock, AlertTriangle, Upload, CheckCircle, FileText } from 'lucide-react'
import { student } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

function getDaysRemaining(dueDate) {
  const due = new Date(dueDate)
  const now = new Date()
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((dueDay - today) / (1000 * 60 * 60 * 24))
}

function DeadlineBadge({ days }) {
  if (days < 0) return <Badge className="bg-rose-500 text-white">Overdue</Badge>
  if (days === 0) return <Badge className="bg-orange-500 text-white animate-pulse">Due Today</Badge>
  if (days === 1) return <Badge className="bg-amber-500 text-white">Due Tomorrow</Badge>
  if (days <= 7) return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">Due This Week</Badge>
  return <Badge className="bg-slate-500/10 text-slate-500">Due in {days} days</Badge>
}

export default function StudentTasksView() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeTask, setActiveTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [loadingSub, setLoadingSub] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await student.tasks.list()
        setTasks(data)
      } catch (err) {
        toast.error('Failed to load upcoming deadlines')
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
  }, [])

  const priorityColors = {
    Low: 'text-emerald-500 bg-emerald-500/10',
    Medium: 'text-amber-500 bg-amber-500/10',
    High: 'text-rose-500 bg-rose-500/10'
  }

  async function handleOpen(task) {
    setActiveTask(task)
    setShowModal(true)
    setLoadingSub(true)
    try {
      const subs = await student.tasks.getSubmissions(task._id)
      setSubmissions(subs)
    } catch (err) {
      toast.error('Failed to load submissions')
    } finally {
      setLoadingSub(false)
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const newSub = await student.tasks.submit(activeTask._id, fd)
      toast.success('Assignment submitted successfully!')
      setFile(null)
      // Reload submissions
      const subs = await student.tasks.getSubmissions(activeTask._id)
      setSubmissions(subs)
      // Update tasks array so the badge updates
      setTasks(prev => prev.map(t => t._id === activeTask._id ? { ...t, submission: newSub } : t))
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageContainer>
      <PageHero 
        icon={CalendarIcon}
        title="Upcoming Deadlines" 
        subtitle="Stay on top of your assignments across all enrolled subjects"
      />

      <SectionCard>
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium text-lg text-slate-900 dark:text-slate-100">No upcoming deadlines!</p>
            <p className="text-sm mt-1">You are all caught up.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => {
              const daysRemaining = getDaysRemaining(task.due_date)
              return (
                <motion.div 
                  key={task._id} 
                  variants={itemVariants} 
                  className={`p-5 rounded-2xl border transition-all ${
                    task.submission ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30' 
                    : daysRemaining <= 1 ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">{task.title}</h3>
                        {daysRemaining <= 3 && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                      </div>
                      
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-2xl leading-relaxed">
                        {task.description || 'No description provided.'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {task.subject_id?.code} - {task.subject_id?.name}
                        </span>
                        
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(task.due_date).toLocaleString()}
                        </span>
                        
                        <span className="text-slate-400">|</span>
                        
                        <span className="text-slate-500">Assigned by: {task.created_by?.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      {task.submission ? (
                        <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Submitted
                        </Badge>
                      ) : (
                        <DeadlineBadge days={daysRemaining} />
                      )}
                      {!task.submission && <Badge className={priorityColors[task.priority]}>{task.priority} Priority</Badge>}
                      
                      <Button variant="outline" size="sm" onClick={() => handleOpen(task)} className={`mt-2 w-full sm:w-auto ${task.submission ? 'text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20' : ''}`}>
                        {task.submission ? (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Manage
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFile(null) }} title={`Submit: ${activeTask?.title || ''}`}>
        <div className="space-y-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Upload your work (PDF, DOCX, ZIP max 10MB)</label>
              <Input 
                type="file" 
                accept=".pdf,.zip,.docx,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={e => setFile(e.target.files[0])} 
                className="mt-1"
                required
              />
            </div>
            <Button type="submit" disabled={uploading} className="w-full bg-[#0F766E] hover:bg-[#0D6B64] text-white">
              {uploading ? 'Uploading...' : 'Submit Assignment'}
            </Button>
          </form>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Submission History</h4>
            {loadingSub ? (
              <Skeleton className="h-12 w-full" />
            ) : submissions.length === 0 ? (
              <p className="text-sm text-slate-500">No submissions yet.</p>
            ) : (
              <div className="space-y-2">
                {submissions.map(sub => (
                  <div key={sub._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{sub.file_name}</p>
                        <p className="text-xs text-slate-500">v{sub.version} • {new Date(sub.submitted_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge className={sub.status === 'Late' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}>
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
