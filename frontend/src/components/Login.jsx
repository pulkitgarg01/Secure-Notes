import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { ShieldCheck, BookOpen, Users, CheckCircle, Loader2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Role-Based Access Control',
    desc: 'Admins, faculty, and students each operate within precisely scoped permissions.',
  },
  {
    icon: BookOpen,
    title: 'Structured Content Management',
    desc: 'Organise academic resources by branch, semester, section, and subject.',
  },
  {
    icon: Users,
    title: 'Secure Resource Delivery',
    desc: 'PDFs streamed through authenticated endpoints with identity watermarking.',
  },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(text || 'Login failed')
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      login(data)
      toast.success('Signed in successfully')
      navigate('/')
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error('Server error. Please check if the backend is running.')
      } else {
        toast.error(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Brand panel ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#0F172A] p-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Acadence</span>
        </div>

        {/* Hero copy */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Academic content,<br />
              <span className="text-brand-accent">structured and secured.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              A platform for colleges and universities to distribute, manage, and access academic resources with role-based precision.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="mt-0.5 w-8 h-8 rounded-md bg-brand-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-slate-400 text-sm leading-snug mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Acadence. All rights reserved.
        </p>
      </div>

      {/* ── Right: Login form ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#0F172A]">Acadence</span>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A]">Sign in</h2>
            <p className="text-[#64748B] text-sm mt-1">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#0F172A]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full h-10 px-3 rounded-md border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#0F172A]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full h-10 px-3 rounded-md border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#0D6B64] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Role hint for portfolio demo */}
          <div className="mt-8 rounded-md border border-[#E2E8F0] bg-white p-3">
            <p className="text-xs font-medium text-[#64748B] mb-2">Demo accounts</p>
            <div className="space-y-1">
              {['admin', 'teacher', 'student'].map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <span className="text-xs text-[#64748B] capitalize">{role}</span>
                  <span className="text-xs text-[#94A3B8]">— contact admin for credentials</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
