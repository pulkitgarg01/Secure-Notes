import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import {
  LayoutDashboard, BookOpen, Clock,
  CheckCircle2, Search, FileText, Calendar
} from 'lucide-react'
import SubjectsPage from './SubjectsPage'
import SubjectDetailPage from './SubjectDetailPage'
import RecentPage from './RecentPage'
import ProgressPage from './ProgressPage'

import DashboardHome from './DashboardHome'
import InboxPage from '../communication/InboxPage'
import StudentTasksView from './StudentTasksView'



export default function StudentDashboard() {
  return (
    <MainLayout
      sidebarTitle="Student Portal"
      navigation={[
        { type: 'item', to: '/student', exact: true, icon: LayoutDashboard, label: 'Overview' },

        { type: 'item', to: '/student/inbox', icon: FileText, label: 'Inbox' },
        { type: 'header', label: 'Learning' },
        { type: 'item', to: '/student/subjects', icon: BookOpen, label: 'My Subjects' },
        { type: 'item', to: '/student/tasks', icon: Calendar, label: 'Deadlines' },
        { type: 'item', to: '/student/recent', icon: Clock, label: 'Recent Resources' },
        { type: 'item', to: '/student/progress', icon: CheckCircle2, label: 'Progress' },
      ]}
    >
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="subjects/*" element={<SubjectsPage />} />
        <Route path="subjects/:id/*" element={<SubjectDetailPage />} />
        <Route path="recent/*" element={<RecentPage />} />
        <Route path="progress/*" element={<ProgressPage />} />

        <Route path="inbox" element={<InboxPage />} />
        <Route path="tasks/*" element={<StudentTasksView />} />
      </Routes>
    </MainLayout>
  )
}
