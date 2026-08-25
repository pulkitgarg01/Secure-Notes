import React, { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Folder, FolderOpen, FileText, ArrowLeft, CheckCircle2, BarChart3, Layers } from 'lucide-react'
import { student } from '../../lib/api'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import SecurePDFViewer from '../SecurePDFViewer'
import KpiCard from '../ui/KpiCard'
import { Skeleton } from '../ui/design-system'

export default function SubjectDetailPage() {
  const { auth } = useAuth()
  const location = useLocation()
  const themeColor = location.state?.color || { accent: '#0F766E', light: 'rgba(15,118,110,0.1)', border: 'rgba(15,118,110,0.3)' }
  const { id: subjectId } = useParams()
  const [modules, setModules] = useState([])
  const [notes, setNotes] = useState({})
  const [selectedNote, setSelectedNote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (subjectId) {
      loadModules()
    }
  }, [subjectId])

  async function loadModules() {
    try {
      const modulesData = await student.modules(subjectId)
      setModules(modulesData)
      
      // Load notes for each module
      const notesPromises = modulesData.map(async (module) => {
        try {
          const notesData = await student.notes(module._id)
          return { moduleId: module._id, notes: notesData }
        } catch {
          return { moduleId: module._id, notes: [] }
        }
      })
      const notesResults = await Promise.all(notesPromises)
      const notesMap = {}
      notesResults.forEach(({ moduleId, notes }) => {
        notesMap[moduleId] = notes
      })
      setNotes(notesMap)
    } catch (err) {
      toast.error('Failed to load modules')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(noteId, completed) {
    try {
      await student.completeNote(noteId, completed)
      toast.success(completed ? 'Marked as complete' : 'Marked as incomplete')
      loadModules()
      
      // Update selected note state if it's the one being toggled
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote({
          ...selectedNote,
          progress: { ...selectedNote.progress, completed }
        })
      }
    } catch (err) {
      toast.error('Failed to update progress')
    }
  }

  const rootModules = modules.filter(m => !m.parent_id)
  const getChildModules = (parentId) => modules.filter(m => m.parent_id?._id === parentId || m.parent_id === parentId)

  return (
    <div className="space-y-4 max-w-5xl animate-fade-in pb-6">
      <div className="flex items-center gap-4">
        <Link to="/student/subjects">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Course Modules</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Browse structured modules and secure resources.</p>
        </div>
      </div>

      {/* KPI Cards */}
      {!loading && modules.length > 0 && (() => {
        const totalModules = modules.length;
        const totalNotes = Object.values(notes).reduce((acc, curr) => acc + curr.length, 0);
        const completedNotes = Object.values(notes).reduce((acc, curr) => acc + curr.filter(n => n.progress?.completed).length, 0);
        const subjectProgress = totalNotes > 0 ? Math.round((completedNotes / totalNotes) * 100) : 0;

        return (
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard 
              title="Modules" 
              value={totalModules} 
              icon={Layers} 
              color={themeColor.accent}
              trend={{ value: 2, label: 'new modules' }}
            />
            <KpiCard 
              title="Resources" 
              value={totalNotes} 
              icon={FileText} 
              color={themeColor.accent}
              trend={{ value: 5, label: 'new files' }}
            />
            <KpiCard 
              title="Progress" 
              value={subjectProgress} 
              icon={BarChart3} 
              color={themeColor.accent}
              suffix="%" 
              trend={{ value: 12, label: 'this week' }}
            />
          </div>
        );
      })()}

      {selectedNote ? (
        <div className="space-y-4 animate-slide-up">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden border-t-4" style={{ borderTopColor: themeColor.accent }}>
            <CardHeader className="bg-slate-50 dark:bg-slate-950/50 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: themeColor.accent, backgroundColor: themeColor.light }}>
                      Secure Document
                    </span>
                  </div>
                  <CardTitle className="text-xl">{selectedNote.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Folder: {selectedNote.module_id?.title}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedNote(null)}>
                  Close Viewer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-200 dark:border-slate-700">
              <SecurePDFViewer
                srcUrl={student.viewNote(selectedNote._id)}
                token={auth?.token || ''}
                watermarkText="Acadence"
              />
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mark this resource as complete to track your learning progress.
                </p>
                <Button
                  onClick={() => handleComplete(selectedNote._id, !selectedNote.progress?.completed)}
                  variant={selectedNote.progress?.completed ? 'outline' : 'default'}
                  className={selectedNote.progress?.completed 
                    ? 'text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/10 hover:text-[#10B981]' 
                    : 'text-white'}
                  style={!selectedNote.progress?.completed ? { backgroundColor: themeColor.accent } : undefined}
                >
                  {selectedNote.progress?.completed ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Completed</>
                  ) : (
                    'Mark as Complete'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              </CardContent>
            </Card>
          ) : modules.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Folder className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">No modules yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">The faculty member has not published any modules for this course yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rootModules.map((module) => (
                <Card key={module._id} className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-shadow">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Folder className="h-5 w-5" style={{ color: themeColor.accent, fill: themeColor.light }} />
                      {module.title}
                    </CardTitle>
                    {module.description && (
                      <CardDescription>{module.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {getChildModules(module._id).length > 0 && (
                      <div className="ml-6 space-y-3">
                        {getChildModules(module._id).map((child) => (
                          <div key={child._id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <FolderOpen className="h-4 w-4" style={{ color: themeColor.accent }} />
                              <span className="font-medium text-slate-800 dark:text-slate-100 text-sm">{child.title}</span>
                            </div>
                            {notes[child._id] && notes[child._id].length > 0 ? (
                              <div className="ml-2 space-y-1.5">
                                {notes[child._id].map((note) => (
                                  <button
                                    key={note._id}
                                    onClick={() => setSelectedNote(note)}
                                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-950 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors text-left group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileText className="h-4 w-4 text-slate-400 group-hover:text-[#0F766E] shrink-0 transition-colors" />
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{note.title}</span>
                                    </div>
                                    {note.progress?.completed && (
                                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-slate-400 ml-2 py-1">Empty folder</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {notes[module._id] && notes[module._id].length > 0 && (
                      <div className="space-y-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                        {notes[module._id].map((note) => (
                          <button
                            key={note._id}
                            onClick={() => setSelectedNote(note)}
                            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-slate-400 group-hover:text-[#0F766E] shrink-0 transition-colors" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{note.title}</span>
                            </div>
                            {note.progress?.completed && (
                              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {(!notes[module._id] || notes[module._id].length === 0) && getChildModules(module._id).length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No resources available in this module.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
