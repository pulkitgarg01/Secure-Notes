import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { ShieldCheck, Loader2, FileText, Lock, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

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
        throw new Error('Login failed')
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      login(data)
      toast.success('Signed in successfully')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex bg-[#020617] text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#0F766E]/30 blur-[140px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 lg:p-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded bg-[#0F172A] flex items-center justify-center shadow-sm border border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M12 2L3 22h4.5l1.8-4h5.4l1.8 4H21L12 2zm-1.8 11L12 8.5 13.8 13h-3.6z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white ml-0.5">Acadence</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-6">
            Academic resources.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] to-[#0F766E]">Distributed securely.</span>
          </h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-12">
            The role-based platform engineered for educational institutions. Distribute academic resources, organize academic structures, and control student access.
          </p>

          {/* UI Composition Preview (Product Mockup) */}
          <div className="pb-4">
            <motion.div 
              animate={{ y: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-full max-w-lg rounded-2xl bg-[#0F172A]/80 border border-slate-800/80 p-1 shadow-2xl shadow-black/50 backdrop-blur-sm relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0F766E]/5 to-transparent rounded-2xl pointer-events-none" />
            <div className="rounded-xl bg-[#1E293B] overflow-hidden">
              <div className="h-10 border-b border-slate-700/50 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <div className="w-3 h-3 rounded-full bg-slate-600" />
              </div>
              <div className="p-5 flex gap-5">
                <div className="w-48 space-y-3">
                  <div className="h-24 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col justify-center px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-[#34D399]" />
                      <div className="w-20 h-3 bg-slate-700 rounded-full" />
                    </div>
                    <div className="w-12 h-2 bg-slate-600 rounded-full" />
                  </div>
                  <div className="h-24 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col justify-center px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[#0F766E]" />
                      <div className="w-24 h-3 bg-slate-700 rounded-full" />
                    </div>
                    <div className="w-16 h-2 bg-slate-600 rounded-full" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-8 rounded-lg bg-slate-800/50 border border-slate-700/50 w-full" />
                  <div className="h-40 rounded-lg bg-[#0F172A] border border-slate-700/50 w-full p-4 flex flex-col gap-3">
                    <div className="w-full h-3 bg-slate-700/50 rounded-full" />
                    <div className="w-[90%] h-3 bg-slate-700/50 rounded-full" />
                    <div className="w-[95%] h-3 bg-slate-700/50 rounded-full" />
                    <div className="w-[80%] h-3 bg-slate-700/50 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          </div>
        </motion.div>

        <p className="text-slate-500 dark:text-slate-400 text-sm">
          © {new Date().getFullYear()} Acadence. Academic Content Distribution Platform.
        </p>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 rounded bg-[#0F172A] flex items-center justify-center shadow-sm border border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M12 2L3 22h4.5l1.8-4h5.4l1.8 4H21L12 2zm-1.8 11L12 8.5 13.8 13h-3.6z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight ml-0.5">Acadence</span>
          </div>

          <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0F766E]/50 to-transparent opacity-50" />
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign in</h2>
              <p className="text-slate-400 text-sm mt-2">
                Enter your credentials to securely access your workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50 focus:border-[#0F766E] transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50 focus:border-[#0F766E] transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-4 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#0D6B64] text-white font-semibold hover:from-[#118B81] hover:to-[#0F766E] focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 focus:ring-offset-[#0F172A] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0F766E]/20"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Authenticating…' : 'Sign in to workspace'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#34D399]" /> Secure
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <LayoutDashboard className="w-4 h-4 text-[#34D399]" /> Role-based
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
