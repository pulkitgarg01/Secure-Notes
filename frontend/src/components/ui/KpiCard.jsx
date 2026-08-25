import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'
import { Skeleton } from './design-system'
import { motion } from 'framer-motion'

/**
 * Premium SaaS KPI Card (Linear/Vercel inspired)
 * 
 * @param {string} title - The title of the metric
 * @param {number|string} value - The main metric value
 * @param {React.ElementType} icon - Lucide icon component
 * @param {string} subtitle - Subtext under the value (e.g. "Active courses")
 * @param {Object} trend - { value: number, label: string } Optional trend indicator
 * @param {string} to - Optional link destination
 * @param {boolean} loading - Loading state
 * @param {string} suffix - Optional suffix for the counter (e.g., "%")
 * @param {string} color - Hex color for the icon background (default: #0F766E)
 */
export default function KpiCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  to,
  loading = false,
  suffix = '',
  color = '#0F766E',
  children
}) {
  const content = (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group relative h-full flex flex-col">
      
      {/* Header: Title and Icon */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</span>
        
        {Icon && (
          <div 
            className="p-2 rounded-[10px] transition-transform duration-300 group-hover:scale-105 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800/50"
            style={{ backgroundColor: `${color}12`, color: color }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main Value and Trend */}
      <div className="flex flex-col flex-1 mt-1">
        <div className="flex items-center gap-3 relative z-10">
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-baseline gap-1 font-sans">
            {loading ? <Skeleton className="h-9 w-20" /> : (
              typeof value === 'number' ? <AnimatedCounter value={value} suffix={suffix} /> : <span>{value}{suffix}</span>
            )}
          </div>
          
          {trend && (
            <div className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
              trend.value > 0 ? 'text-emerald-700 bg-emerald-50' : 
              trend.value < 0 ? 'text-rose-700 bg-rose-50' : 
              'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950'
            }`}>
              {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> : 
               trend.value < 0 ? <TrendingDown className="w-3 h-3" /> : 
               <Minus className="w-3 h-3" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Footer: Subtitle and Timeline */}
        <div className="mt-1">
          {subtitle && (
            <p className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">
              {subtitle}
            </p>
          )}
          {trend && trend.label && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {trend.label}
            </p>
          )}
        </div>
      </div>

      {/* Custom children (e.g. progress bars) */}
      {children && (
        <div className="mt-4 relative z-10">
          {children}
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-2xl">
        {content}
      </Link>
    )
  }

  return content
}
