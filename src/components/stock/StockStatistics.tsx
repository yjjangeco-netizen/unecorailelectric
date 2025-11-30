'use client'

import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

interface StockStatisticsProps {
  totalItems: number
  totalQuantity: number
  lowStockItems: number
  totalValue: number
  userLevel?: string | undefined
}

export default function StockStatistics({
  totalItems,
  totalQuantity,
  lowStockItems,
  totalValue,
  userLevel
}: StockStatisticsProps) {
  // LEVEL2 사용자는 총품목수와 총재고수량만 표시
  const isLevel2 = userLevel === '2'
  
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isLevel2 ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4 h-full`}>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+2.5%</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Total Quantity</p>
          <p className="text-3xl font-bold text-gray-900">{totalQuantity.toLocaleString()}</p>
        </div>
      </div>

      {/* LEVEL3 이상에서만 부족재고 표시 */}
      {!isLevel2 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${lowStockItems > 0 ? 'bg-rose-50' : 'bg-gray-50'}`}>
              <AlertTriangle className={`h-6 w-6 ${lowStockItems > 0 ? 'text-rose-600' : 'text-gray-400'}`} />
            </div>
            {lowStockItems > 0 && (
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Action Needed</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-gray-900">{lowStockItems.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* LEVEL3 이상에서만 총재고가치 표시 */}
      {!isLevel2 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-violet-50 rounded-2xl">
              <DollarSign className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Value</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalValue >= 1000000000 
                ? `${(totalValue / 1000000000).toFixed(1)}B`
                : totalValue >= 1000000 
                ? `${(totalValue / 1000000).toFixed(1)}M`
                : totalValue >= 1000 
                ? `${(totalValue / 1000).toFixed(1)}K`
                : totalValue.toLocaleString()
              }
              <span className="text-lg font-normal text-gray-400 ml-1">KRW</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
