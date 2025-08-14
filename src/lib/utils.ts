import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 통화 형식으로 포맷팅
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount)
}

/**
 * 재고 상태에 따른 색상 반환
 */
export const getStockStatusColor = (status: string): string => {
  switch (status) {
    case 'low_stock':
      return 'text-red-600'
    case 'normal':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

/**
 * 재고 상태에 따른 배경색 반환
 */
export const getStockStatusBgColor = (status: string): string => {
  switch (status) {
    case 'low_stock':
      return 'bg-red-100'
    case 'normal':
      return 'bg-green-100'
    default:
      return 'bg-gray-100'
  }
}

/**
 * 날짜 형식으로 포맷팅
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * 날짜와 시간 형식으로 포맷팅
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
} 