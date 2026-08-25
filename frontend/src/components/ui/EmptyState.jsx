import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionLink 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ y: [-3, 3, -3], opacity: 1 }}
        transition={{ 
          opacity: { delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }}
        className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <Icon className="w-8 h-8 text-slate-400" />
      </motion.div>
      <motion.h3 
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight"
      >
        {title}
      </motion.h3>
      <motion.p 
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm"
      >
        {description}
      </motion.p>
      {actionLabel && actionLink && (
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Link 
            to={actionLink} 
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F766E] hover:bg-[#0D6B64] text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            {actionLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}
