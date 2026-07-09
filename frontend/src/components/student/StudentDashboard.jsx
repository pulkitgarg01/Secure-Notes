import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import {
  LayoutDashboard, BookOpen, Clock,
  CheckCircle2, Search
} from 'lucide-react'
import SubjectsPage from './SubjectsPage'
import SubjectDetailPage from './SubjectDetailPage'
import RecentPage from './RecentPage'
import ProgressPage from './ProgressPage'
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

export default function StudentDashboard() {
  return (
    <MainLayout
      sidebarTitle="Student Portal"
      sidebar={
        <nav className="space-y-0.5">
          <NavItem to="/student" exact icon={LayoutDashboard} label="Overview" />
          <NavItem to="/student/search" icon={Search} label="Search" />

          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Learning
          </p>
          <NavItem to="/student/subjects" icon={BookOpen} label="My Subjects" />
          <NavItem to="/student/recent" icon={Clock} label="Recent Notes" />
          <NavItem to="/student/progress" icon={CheckCircle2} label="Progress" />
        </nav>
      }
    >
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="search" element={<SearchPage />} />
      </Routes>
    </MainLayout>
  )
}
