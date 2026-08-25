import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, useSpring, useTransform } from 'framer-motion'

export default function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  prefix = '', 
  suffix = '',
  className = '' 
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10%" })
  // Use a spring for natural feeling deceleration
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 15,
    mass: 1
  })

  useEffect(() => {
    if (isInView) {
      const numValue = typeof value === 'number' ? value : parseFloat(value)
      if (!isNaN(numValue)) {
        springValue.set(numValue)
      } else {
        springValue.set(0)
      }
    }
  }, [isInView, value, springValue])

  const displayValue = useTransform(springValue, (current) => {
    if (isNaN(current)) return `${prefix}—${suffix}`
    return `${prefix}${Math.round(current).toLocaleString()}${suffix}`
  })

  // Fallback for non-numeric or loading states
  if (value === '—' || value === undefined || value === null) {
    return <span ref={ref} className={className}>—</span>
  }

  return (
    <motion.span ref={ref} className={className}>
      {displayValue}
    </motion.span>
  )
}
