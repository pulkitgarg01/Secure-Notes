import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef(({ className, wrapperClassName, children, ...props }, ref) => {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
});

Select.displayName = 'Select';
