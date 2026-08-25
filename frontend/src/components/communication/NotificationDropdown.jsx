import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, MessageSquare, Megaphone, FileText } from 'lucide-react'
import { communication } from '../../lib/api'
import { Badge } from '../ui/design-system'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Poll every min
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await communication.notifications.list()
      setNotifications(data)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation()
    try {
      await communication.notifications.markRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await communication.notifications.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getIcon = (type) => {
    if (type === 'message') return <MessageSquare className="w-4 h-4 text-blue-500" />
    if (type === 'announcement') return <Megaphone className="w-4 h-4 text-emerald-500" />
    return <FileText className="w-4 h-4 text-purple-500" />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[4.5rem] right-8 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-[999] origin-top-right"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-[#0F766E] hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n._id} 
                    className={`p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 ${!n.is_read ? 'bg-[#0F766E]/5 dark:bg-[#0F766E]/10' : ''}`}
                  >
                    <div className="mt-1 flex-shrink-0 bg-white dark:bg-slate-800 rounded-full p-1.5 border border-slate-100 dark:border-slate-700 shadow-sm">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {n.title}
                      </p>
                      {n.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {n.description}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {!n.is_read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(e, n._id)}
                        className="flex-shrink-0 text-slate-400 hover:text-[#0F766E] transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
              <span className="text-xs text-slate-500">Notifications sync automatically</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
