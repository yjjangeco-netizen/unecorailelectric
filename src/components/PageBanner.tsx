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
        "w-full mb-4 sm:mb-6 flex flex-col justify-end pt-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-5 sm:h-6 bg-blue-600 rounded-full inline-block"></span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
      </div>
      <p className="text-gray-500 text-xs sm:text-sm mt-1.5 ml-3.5">
        {subtitle}
      </p>
    </div>
  )
}
