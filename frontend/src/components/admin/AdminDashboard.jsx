import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import {
  LayoutDashboard, Users, GitBranch, Calendar,
  Layers, BookOpen, UserCog,
} from 'lucide-react'
import BranchesPage from './BranchesPage'
import SemestersPage from './SemestersPage'
import SectionsPage from './SectionsPage'
import SubjectsPage from './SubjectsPage'
import UsersPage from './UsersPage'
import SubjectAssignmentsPage from './SubjectAssignmentsPage'
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

export default function AdminDashboard() {
  return (
    <MainLayout
      sidebarTitle="Administration"
      sidebar={
        <nav className="space-y-0.5">
          <NavItem to="/admin" exact icon={LayoutDashboard} label="Overview" />

          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Users
          </p>
          <NavItem to="/admin/users" icon={Users} label="Manage Users" />
          <NavItem to="/admin/assignments" icon={UserCog} label="Assign Subjects" />

          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Academic Structure
          </p>
          <NavItem to="/admin/branches" icon={GitBranch} label="Branches" />
          <NavItem to="/admin/semesters" icon={Calendar} label="Semesters" />
          <NavItem to="/admin/sections" icon={Layers} label="Sections" />
          <NavItem to="/admin/subjects" icon={BookOpen} label="Subjects" />
        </nav>
      }
    >
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="users/*" element={<UsersPage />} />
        <Route path="branches/*" element={<BranchesPage />} />
        <Route path="semesters/*" element={<SemestersPage />} />
        <Route path="sections/*" element={<SectionsPage />} />
        <Route path="subjects/*" element={<SubjectsPage />} />
        <Route path="assignments/*" element={<SubjectAssignmentsPage />} />
      </Routes>
    </MainLayout>
  )
}
