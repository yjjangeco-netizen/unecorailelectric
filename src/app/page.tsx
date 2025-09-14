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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 shiftee-fade-in">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="shiftee-container">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">유네코레일</h1>
                <p className="text-xs text-gray-600">전기파트 업무 시스템</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signup">
                <Button variant="outline">무료 체험</Button>
              </Link>
              <Link href="/login">
                <Button>로그인</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="shiftee-container text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Empower Your Workforce,<br />
            <span className="text-blue-600">Streamline your HR process</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            유네코레일 전기팀을 위한 통합 업무 관리 시스템. 재고 관리부터 입찰 모니터링까지 모든 것을 하나의 플랫폼에서.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                30일 무료 체험 시작
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3">
                영업팀 문의
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="shiftee-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              모든 업무를 하나의 플랫폼에서
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              재고 관리, 일정 관리, 입찰 모니터링까지 모든 기능을 통합하여 효율적인 업무 환경을 제공합니다.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card 
                  key={index}
                  className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${isHovered === feature.title ? 'transform scale-105' : ''}`}
                  onMouseEnter={() => setIsHovered(feature.title)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="shiftee-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              비즈니스에 맞는 플랜을 선택하세요
            </h2>
            <p className="text-xl text-gray-600">
              다양한 요구사항에 맞는 유연한 가격 정책
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative transition-all duration-300 hover:shadow-xl ${plan.recommended ? 'ring-2 ring-blue-500 transform scale-105' : ''} ${plan.color}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      추천
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.buttonColor} text-white`}
                    size="lg"
                  >
                    {plan.price === '문의' ? '영업팀 문의' : '시작하기'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="shiftee-container text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            30일 무료 체험으로 시작하세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            계약 없이 모든 기능을 체험해보세요. 언제든지 중단할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                무료 체험 시작
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
                영업팀 문의
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="shiftee-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-lg font-bold">유네코레일</span>
              </div>
              <p className="text-gray-400">
                전기파트 업무 시스템으로 더 나은 업무 환경을 만들어갑니다.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/stock-management" className="hover:text-white">재고 관리</Link></li>
                <li><Link href="/schedule" className="hover:text-white">일정 관리</Link></li>
                <li><Link href="/nara-monitoring" className="hover:text-white">입찰 모니터링</Link></li>
                <li><Link href="/user-management" className="hover:text-white">사용자 관리</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">지원</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">도움말</Link></li>
                <li><Link href="/contact" className="hover:text-white">문의하기</Link></li>
                <li><Link href="/security" className="hover:text-white">보안</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">회사</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">회사 소개</Link></li>
                <li><Link href="/blog" className="hover:text-white">블로그</Link></li>
                <li><Link href="/careers" className="hover:text-white">채용</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 유네코레일. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}