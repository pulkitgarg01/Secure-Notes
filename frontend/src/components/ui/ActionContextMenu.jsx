import React from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { Link, useNavigate } from 'react-router-dom'
import { Edit, Trash2, Eye, Folder, BookOpen, User } from 'lucide-react'

export function ActionContextMenu({ children, actions }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      
      <ContextMenu.Portal>
        <ContextMenu.Content 
          className="min-w-[180px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-100"
        >
          {actions.map((action, idx) => {
            if (action.separator) {
              return <ContextMenu.Separator key={idx} className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-1" />
            }
            
            return (
              <ContextMenu.Item 
                key={idx}
                onSelect={action.onSelect}
                className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg cursor-pointer outline-none transition-colors ${
                  action.danger 
                    ? 'text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10' 
                    : 'text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800'
                }`}
              >
                {action.icon && <action.icon className="w-4 h-4 shrink-0 opacity-70" />}
                {action.label}
              </ContextMenu.Item>
            )
          })}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
