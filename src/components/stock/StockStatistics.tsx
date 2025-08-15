'use client'

import { Package, TrendingUp, AlertTriangle } from 'lucide-react'

interface StockStatisticsProps {
  totalItems: number
  totalQuantity: number
  lowStockItems: number
  totalValue: number
}

export default function StockStatistics({
  totalItems,
  totalQuantity,
  lowStockItems,
  totalValue
}: StockStatisticsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">총 품목 수</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">총 재고 수량</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalQuantity.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">부족 재고</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{lowStockItems.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">총 재고 가치</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {totalValue >= 1000000000 
                ? `${(totalValue / 1000000000).toFixed(1)}B`
                : totalValue >= 1000000 
                ? `${(totalValue / 1000000).toFixed(1)}M`
                : totalValue >= 1000 
                ? `${(totalValue / 1000).toFixed(1)}K`
                : totalValue.toLocaleString()
              }원
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
