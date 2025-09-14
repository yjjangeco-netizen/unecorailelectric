'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Package, 
  Calendar, 
  Users, 
  BarChart3, 
  Search,
  CheckCircle,
  Star,
  ArrowRight,
  Shield,
  Zap,
  Globe
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [isHovered, setIsHovered] = useState<string | null>(null)

  const features = [
    {
      icon: Package,
      title: '재고 관리',
      description: '실시간 재고 현황 추적 및 관리',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Calendar,
      title: '일정 관리',
      description: '업무 일정 및 프로젝트 관리',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: BarChart3,
      title: '업무보고',
      description: '업무보고 및 관리',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Search,
      title: '입찰 모니터링',
      description: 'Nara 입찰공고 실시간 모니터링',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
  ]


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">유네코레일</h1>
                <p className="text-sm text-gray-600 font-medium">전기파트 업무 시스템</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            유네코레일<br />
            <span className="text-yellow-300">전기제어파트 업무관리 도구</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            유네코레일 전기팀을 위한 통합 업무 관리 시스템.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-10 py-4 text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                가입
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-10 py-4 text-lg font-bold border-2 border-white text-gray-900 bg-white hover:bg-gray-100 hover:text-blue-600 transition-all duration-300">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              모든 업무를 하나의 플랫폼에서
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              재고 관리, 일정 관리, 입찰 모니터링까지 모든 기능을 통합하여 효율적인 업무 환경을 제공합니다.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-blue-200 ${isHovered === feature.title ? 'transform scale-105 -rotate-1' : 'hover:rotate-1'}`}
                  onMouseEnter={() => setIsHovered(feature.title)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">유네코레일</span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              전기파트 업무 시스템으로 더 나은 업무 환경을 만들어갑니다.
            </p>
            <div className="border-t border-gray-700 pt-8">
              <p className="text-gray-400 text-lg">&copy; 2025 유네코레일. All rights reserved. Made by YJJANG.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}