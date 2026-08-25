import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { motion } from 'framer-motion'

export function ThemeToggle({ isCollapsed }) {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const renderIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />
    if (theme === 'dark') return <Moon className="w-5 h-5" />
    return <Monitor className="w-5 h-5" />
  }

  const renderLabel = () => {
    if (theme === 'light') return 'Light Mode'
    if (theme === 'dark') return 'Dark Mode'
    return 'System Theme'
  }

  return (
    <button
      onClick={cycleTheme}
      className={`flex items-center gap-3 p-2 w-full rounded-xl hover:bg-white/5 border border-transparent hover:border-slate-800 transition-all cursor-pointer text-slate-400 hover:text-slate-200 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
      title={isCollapsed ? renderLabel() : undefined}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
      >
        {renderIcon()}
      </motion.div>
      
      {!isCollapsed && (
        <span className="font-medium text-sm truncate">
          {renderLabel()}
        </span>
      )}
    </button>
  )
}
