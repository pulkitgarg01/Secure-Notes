import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import {
  LayoutDashboard, Users, GitBranch, Calendar,
  Layers, BookOpen, UserCog, FileText, Megaphone
} from 'lucide-react'
import BranchesPage from './BranchesPage'
import SemestersPage from './SemestersPage'
import SectionsPage from './SectionsPage'
import SubjectsPage from './SubjectsPage'
import UsersPage from './UsersPage'
import SubjectAssignmentsPage from './SubjectAssignmentsPage'
import FilesPage from './FilesPage'
import DashboardHome from './DashboardHome'
import InboxPage from '../communication/InboxPage'
import { MessageSquare } from 'lucide-react'



export default function AdminDashboard() {
  return (
    <MainLayout
      sidebarTitle="Administration"
      navigation={[
        { type: 'item', to: '/admin', exact: true, icon: LayoutDashboard, label: 'Overview' },
        { type: 'header', label: 'Users' },
        { type: 'item', to: '/admin/users', icon: Users, label: 'Manage Users' },
        { type: 'item', to: '/admin/assignments', icon: UserCog, label: 'Assign Subjects' },
        { type: 'header', label: 'Academic Structure' },
        { type: 'item', to: '/admin/branches', icon: GitBranch, label: 'Branches' },
        { type: 'item', to: '/admin/semesters', icon: Calendar, label: 'Semesters' },
        { type: 'item', to: '/admin/sections', icon: Layers, label: 'Sections' },
        { type: 'item', to: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
        { type: 'header', label: 'Content' },
        { type: 'item', to: '/admin/files', icon: FileText, label: 'Platform Files' },
        { type: 'item', to: '/admin/inbox', icon: MessageSquare, label: 'Communications' },
      ]}
    >
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="users/*" element={<UsersPage />} />
        <Route path="branches/*" element={<BranchesPage />} />
        <Route path="semesters/*" element={<SemestersPage />} />
        <Route path="sections/*" element={<SectionsPage />} />
        <Route path="subjects/*" element={<SubjectsPage />} />
        <Route path="assignments/*" element={<SubjectAssignmentsPage />} />
        <Route path="files/*" element={<FilesPage />} />
        <Route path="inbox/*" element={<InboxPage />} />
      </Routes>
    </MainLayout>
  )
}
