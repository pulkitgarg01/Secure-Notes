import React from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Search, X } from 'lucide-react'
import { Input } from './input'
import { Select } from './select'
import EmptyState from './EmptyState'

import AnimatedCounter from './AnimatedCounter'
import KpiCard from './KpiCard'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Custom Bezier for smoother, premium motion
const smoothEase = [0.22, 1, 0.36, 1]

// Layout Wrappers
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: smoothEase } }
}

export function PageContainer({ children, className = '' }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`space-y-5 max-w-[1600px] mx-auto w-full pb-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Hero Section
export function PageHero({ title, description, action }) {
  return (
    <motion.div 
      variants={itemVariants} 
      className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-2 pr-4 lg:pr-[var(--hero-pr,0px)]"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tighter">{title}</h1>
        <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-1.5">{description}</p>
      </div>
      {action && (
        <div className="flex shrink-0">
          {action}
        </div>
      )}
    </motion.div>
  )
}

export function StatCard({ title, icon, value, label, trend }) {
  // Generate deterministic demo trend data if none provided
  const fallbackTrendValue = (title.length * 7) % 35 + 2;
  const isNegative = title.length % 3 === 0;
  
  return (
    <KpiCard 
      title={title}
      icon={icon}
      value={value}
      subtitle={label}
      color="#0F766E"
      trend={trend || { value: isNegative ? -fallbackTrendValue : fallbackTrendValue, label: 'vs last month' }}
    />
  )
}

export function StatsGrid({ children }) {
  return (
    <motion.div variants={itemVariants} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {children}
    </motion.div>
  )
}

// Section Container (for forms / lists)
export function SectionCard({ title, description, children, className = '' }) {
  return (
    <Card className={`overflow-hidden rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      {(title || description) && (
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          {title && <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</CardTitle>}
          {description && <CardDescription className="text-sm font-normal text-slate-500 dark:text-slate-400">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  )
}

// Premium Table Components
export function TableToolbar({ children, className = '' }) {
  return (
    <div className={`p-4 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 flex flex-col md:flex-row gap-4 items-center justify-between ${className}`}>
      {children}
    </div>
  )
}

export function TableSearch({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full md:w-96 group">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0F766E] transition-colors" />
      <Input 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-10 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F766E]/50 focus:ring-4 focus:ring-[#0F766E]/10 transition-all rounded-xl shadow-sm text-sm"
      />
    </div>
  )
}

export function TableFilter({ value, onChange, options, className = '' }) {
  return (
    <Select
      className={cn("md:w-auto w-full", className)}
      value={value}
      onChange={onChange}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </Select>
  )
}

export function TableEmptyState({ colSpan, icon, title, description }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-16">
        <EmptyState 
          icon={icon} 
          title={title} 
          description={description} 
        />
      </td>
    </tr>
  )
}

// Global Modal
export function Modal({ isOpen, onClose, title, description, children, className = '' }) {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/10 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
              className={`w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] ${className}`}
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h2>
                  {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}

// Premium Shimmer Skeleton Loader
export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800/50 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
    </div>
  )
}

// Standardized Table Skeleton
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-800/50 hidden md:table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <Skeleton className="h-5 w-[80%]" />
            </td>
          ))}
        </tr>
      ))}
      <tr className="md:hidden">
        <td colSpan={columns}>
          <div className="space-y-4 py-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                <Skeleton className="h-5 w-[60%]" />
                <Skeleton className="h-4 w-[40%]" />
                <Skeleton className="h-4 w-[30%]" />
              </div>
            ))}
          </div>
        </td>
      </tr>
    </>
  )
}

// -----------------------------------------------------------------------------
// Animated Segmented Controls (Tabs)
// -----------------------------------------------------------------------------
export function SegmentedControl({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={cn("flex items-center p-1 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-800/50 w-fit relative", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors outline-none z-10",
              isActive ? "text-slate-900 dark:text-slate-50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-control-active"
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Soft Professional Badge
// -----------------------------------------------------------------------------
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
    primary: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20 dark:bg-[#0F766E]/20 dark:text-teal-400"
  }

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border flex items-center justify-center gap-1 w-fit",
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
