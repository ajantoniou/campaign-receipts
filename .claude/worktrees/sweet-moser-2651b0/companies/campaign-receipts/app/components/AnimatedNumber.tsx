'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

type Props = {
  value: number
  decimals?: number
  className?: string
  suffix?: string
  duration?: number
}

export default function AnimatedNumber({ value, decimals = 0, className, suffix = '', duration: _d = 1.5 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { damping: 60, stiffness: 80, mass: 1 })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (inView) motionValue.set(value)
  }, [inView, motionValue, value])

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      const formatted = decimals === 0
        ? Math.round(v).toLocaleString()
        : v.toFixed(decimals)
      setDisplay(formatted)
    })
    return () => unsubscribe()
  }, [spring, decimals])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}
