import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import {
  LayoutDashboard, BookOpen, Users,
  FolderOpen, FileText, Search, Megaphone
} from 'lucide-react'
import SubjectsPage from './SubjectsPage'
import StudentsPage from './StudentsPage'
import ModulesPage from './ModulesPage'
import NotesPage from './NotesPage'

import DashboardHome from './DashboardHome'
import InboxPage from '../communication/InboxPage'
import TeacherTasksManager from './TeacherTasksManager'



export default function TeacherDashboard() {
  return (
    <MainLayout
      sidebarTitle="Faculty Portal"
      navigation={[
        { type: 'item', to: '/teacher', exact: true, icon: LayoutDashboard, label: 'Overview' },

        { type: 'item', to: '/teacher/inbox', icon: FileText, label: 'Inbox' },
        { type: 'header', label: 'My Classes' },
        { type: 'item', to: '/teacher/subjects', icon: BookOpen, label: 'My Subjects' },
        { type: 'item', to: '/teacher/students', icon: Users, label: 'My Students' },
        { type: 'header', label: 'Resources' },
        { type: 'item', to: '/teacher/modules', icon: FolderOpen, label: 'Modules' },
        { type: 'item', to: '/teacher/notes', icon: FileText, label: 'Resources' },
        { type: 'item', to: '/teacher/tasks', icon: FileText, label: 'Assignments' },
      ]}
    >
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="subjects/*" element={<SubjectsPage />} />
        <Route path="students/*" element={<StudentsPage />} />
        <Route path="modules/*" element={<ModulesPage />} />
        <Route path="notes/*" element={<NotesPage />} />

        <Route path="inbox" element={<InboxPage />} />
        <Route path="tasks/*" element={<TeacherTasksManager />} />
      </Routes>
    </MainLayout>
  )
}
