'use client'

import { cn } from '@/lib/utils'

interface PageBannerProps {
  title: string
  subtitle: string
  className?: string
}

export default function PageBanner({ title, subtitle, className }: PageBannerProps) {
  return (
    <div 
      className={cn(
        "w-full rounded-[2.5rem] p-10 mb-8 relative overflow-hidden",
        "bg-gradient-to-r from-[#F48FB1] via-[#FCE38A] to-[#90CAF9]",
        "shadow-sm",
        className
      )}
    >
      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-[#4A4A4A] text-lg font-medium">
          {subtitle}
        </p>
      </div>
      
      {/* Optional: Add subtle overlay or pattern if needed to match the exact look */}
      <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
    </div>
  )
}
