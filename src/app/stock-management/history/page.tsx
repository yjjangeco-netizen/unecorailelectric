'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Printer, ArrowLeft, Calendar, Trash2 } from "lucide-react"

interface StockHistoryItem {
  id: string
  item_name: string
  type: 'in' | 'out'
  quantity: number
  previous_quantity: number
  new_quantity: number
  reason: string
  note: string
  location: string
  user_level: string
  created_at: string
}

export default function StockHistoryPage() {
  const router = useRouter()
  const { user } = useUser()
  const [history, setHistory] = useState<StockHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const userLevel = String(user?.level || '1')
  const isAdmin = userLevel?.toLowerCase() === 'administrator' || userLevel === 'admin' || userLevel === '5'

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
      
      const res = await fetch(`/api/stock/history?${params.toString()}`)
      const data = await res.json()
      
      if (data.history) {
        setHistory(data.history)
      } else {
        setHistory([])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, startDate, endDate, typeFilter])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchHistory()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(history.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
    }
  }

  const handleDelete = async () => {
    if (!confirm('선택한 기록을 영구적으로 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/stock/history?ids=${selectedItems.join(',')}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete history')
      }

      setSelectedItems([])
      fetchHistory()
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('Delete error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.close()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Close
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Stock In/Out History</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && selectedItems.length > 0 && (
              <Button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedItems.length})
              </Button>
            )}
            <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="w-4 h-4" />
              Print Report
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 no-print">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search by product, location, or reason..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <span className="self-center text-gray-500">to</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">Search</Button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {isAdmin && (
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedItems.length === history.length && history.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>User Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} className="h-32 text-center text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} className="h-32 text-center text-gray-500">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'in' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.type === 'in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.item_name || '-'}
                    </TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {item.type === 'in' ? '+' : '-'}{item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-500">
                      {item.new_quantity}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={item.reason || ''}>
                      {item.reason || '-'}
                    </TableCell>
                    <TableCell>
                      Level {item.user_level || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-border {
            border: none;
            box-shadow: none;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}
