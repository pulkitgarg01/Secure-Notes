import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import {
  LayoutDashboard, BookOpen, Users,
  FolderOpen, FileText, Search
} from 'lucide-react'
import SubjectsPage from './SubjectsPage'
import StudentsPage from './StudentsPage'
import ModulesPage from './ModulesPage'
import NotesPage from './NotesPage'
import SearchPage from './SearchPage'
import DashboardHome from './DashboardHome'

function NavItem({ to, icon: Icon, label, exact = false }) {
  const { pathname } = useLocation()
  const active = exact ? pathname === to : pathname.startsWith(to)
  return (
    <Link to={to} className="block">
      <div
        className={[
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active
            ? 'bg-[#0F766E] text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5',
        ].join(' ')}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </div>
    </Link>
  )
}

export default function TeacherDashboard() {
  return (
    <MainLayout
      sidebarTitle="Faculty Portal"
      sidebar={
        <nav className="space-y-0.5">
          <NavItem to="/teacher" exact icon={LayoutDashboard} label="Overview" />
          <NavItem to="/teacher/search" icon={Search} label="Search" />

          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            My Classes
          </p>
          <NavItem to="/teacher/subjects" icon={BookOpen} label="My Subjects" />
          <NavItem to="/teacher/students" icon={Users} label="My Students" />

          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Resources
          </p>
          <NavItem to="/teacher/modules" icon={FolderOpen} label="Modules" />
          <NavItem to="/teacher/notes" icon={FileText} label="Notes" />
        </nav>
      }
    >
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="subjects/*" element={<SubjectsPage />} />
        <Route path="students/*" element={<StudentsPage />} />
        <Route path="modules/*" element={<ModulesPage />} />
        <Route path="notes/*" element={<NotesPage />} />
        <Route path="search/*" element={<SearchPage />} />
      </Routes>
    </MainLayout>
  )
}
