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
      icon: Users,
      title: '사용자 관리',
      description: '직원 정보 및 권한 관리',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: BarChart3,
      title: '리포팅',
      description: '실시간 데이터 분석 및 보고서',
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
    {
      icon: Shield,
      title: '보안',
      description: '엔터프라이즈급 보안 시스템',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  const plans = [
    {
      name: 'Basic Plan',
      description: '기본적인 업무 관리 기능',
      price: '무료',
      period: '30일 무료 체험',
      features: [
        '재고 현황 조회',
        '기본 일정 관리',
        '사용자 관리',
        '기본 리포팅',
        '모바일 앱 지원'
      ],
      recommended: false,
      color: 'border-gray-200',
      buttonColor: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      name: 'Standard Plan',
      description: '확장 가능한 비즈니스에 최적화',
      price: '월 50,000원',
      period: '사용자당',
      features: [
        'Basic Plan의 모든 기능',
        '고급 재고 관리',
        '프로젝트 관리',
        '고급 리포팅',
        '입찰 모니터링',
        '워크플로우 관리',
        'API 연동',
        '우선 지원'
      ],
      recommended: true,
      color: 'border-blue-500',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Enterprise Plan',
      description: '대기업을 위한 엔터프라이즈 솔루션',
      price: '문의',
      period: '맞춤형 가격',
      features: [
        'Standard Plan의 모든 기능',
        '커스텀 개발',
        '전용 서버',
        'SSO 연동',
        '고급 보안',
        '전담 지원',
        '감사 로그',
        'IP 화이트리스트'
      ],
      recommended: false,
      color: 'border-purple-500',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    }
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
            <div className="flex items-center space-x-4">
              <Link href="/signup">
                <Button variant="outline" className="px-6 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300">
                  무료 체험
                </Button>
              </Link>
              <Link href="/login">
                <Button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  로그인
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            Empower Your Workforce,<br />
            <span className="text-yellow-300">Streamline your HR process</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            유네코레일 전기팀을 위한 통합 업무 관리 시스템. 재고 관리부터 입찰 모니터링까지 모든 것을 하나의 플랫폼에서.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-10 py-4 text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                30일 무료 체험 시작
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-10 py-4 text-lg font-bold border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all duration-300">
                영업팀 문의
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

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              비즈니스에 맞는 플랜을 선택하세요
            </h2>
            <p className="text-xl md:text-2xl text-gray-600">
              다양한 요구사항에 맞는 유연한 가격 정책
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${plan.recommended ? 'ring-4 ring-blue-500 transform scale-105 -rotate-1' : 'hover:rotate-1'} ${plan.color}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full shadow-lg">
                      <Star className="w-5 h-5 mr-2 inline" />
                      추천
                    </div>
                  </div>
                )}
                
                <div className="text-center pb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                  <p className="text-gray-600 text-lg mb-6">{plan.description}</p>
                  <div className="mb-8">
                    <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2 text-lg">{plan.period}</span>
                  </div>
                </div>
                
                <div className="pt-0">
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" />
                        <span className="text-gray-700 text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-4 text-lg font-bold ${plan.buttonColor} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
                    size="lg"
                  >
                    {plan.price === '문의' ? '영업팀 문의' : '시작하기'}
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
            30일 무료 체험으로 시작하세요
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            계약 없이 모든 기능을 체험해보세요. 언제든지 중단할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-12 py-4 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                무료 체험 시작
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-12 py-4 text-xl font-bold border-3 border-white text-white hover:bg-white hover:text-blue-600 transition-all duration-300">
                영업팀 문의
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">유네코레일</span>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                전기파트 업무 시스템으로 더 나은 업무 환경을 만들어갑니다.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">서비스</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/stock-management" className="hover:text-yellow-400 text-lg transition-colors duration-300">재고 관리</Link></li>
                <li><Link href="/schedule" className="hover:text-yellow-400 text-lg transition-colors duration-300">일정 관리</Link></li>
                <li><Link href="/nara-monitoring" className="hover:text-yellow-400 text-lg transition-colors duration-300">입찰 모니터링</Link></li>
                <li><Link href="/user-management" className="hover:text-yellow-400 text-lg transition-colors duration-300">사용자 관리</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">지원</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/help" className="hover:text-yellow-400 text-lg transition-colors duration-300">도움말</Link></li>
                <li><Link href="/contact" className="hover:text-yellow-400 text-lg transition-colors duration-300">문의하기</Link></li>
                <li><Link href="/security" className="hover:text-yellow-400 text-lg transition-colors duration-300">보안</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">회사</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/about" className="hover:text-yellow-400 text-lg transition-colors duration-300">회사 소개</Link></li>
                <li><Link href="/blog" className="hover:text-yellow-400 text-lg transition-colors duration-300">블로그</Link></li>
                <li><Link href="/careers" className="hover:text-yellow-400 text-lg transition-colors duration-300">채용</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-lg">&copy; 2024 유네코레일. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}